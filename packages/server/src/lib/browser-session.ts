/**
 * Browser Session Manager — launches a headed Playwright browser
 * with persistent profiles for interactive web browsing from AI chat.
 */

import { homedir } from "os";
import { join } from "path";
import { mkdirSync } from "fs";
import { htmlToText } from "./html-utils.js";

// Playwright types — imported dynamically to avoid hard dep in non-browser paths
type Browser = import("playwright").Browser;
type BrowserContext = import("playwright").BrowserContext;
type Page = import("playwright").Page;

export interface BrowseResult {
  pageUrl: string;
  pageTitle: string;
  screenshot: string; // base64 PNG
  accessibilityTree: string; // truncated a11y summary
  textContent: string; // extracted text (max 4000 chars)
}

/** Result type that signals multi-part content (screenshot + text) to the chat pipeline. */
export interface MultipartToolResult {
  _multipart: true;
  text: string;
  imageBase64: string;
}

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 720;
const MAX_A11Y_CHARS = 6000;
const MAX_TEXT_CHARS = 4000;

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "default";
  }
}

function getProfileDir(domain: string): string {
  const dir = join(homedir(), ".basics-os", "browser-profiles", domain);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** Truncate an aria snapshot string to fit within token limits. */
function truncateAriaSnapshot(snapshot: string, maxChars = MAX_A11Y_CHARS): string {
  if (snapshot.length <= maxChars) return snapshot;
  return snapshot.slice(0, maxChars) + "\n[...truncated]";
}

export class BrowserSessionManager {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private currentDomain: string | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private playwrightModule: typeof import("playwright") | null = null;

  private resetIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.close().catch(() => {});
    }, IDLE_TIMEOUT_MS);
  }

  private async getPlaywright() {
    if (!this.playwrightModule) {
      this.playwrightModule = await import("playwright");
    }
    return this.playwrightModule;
  }

  /** Launch or reuse a headed browser with persistent profile for the domain. */
  async ensureBrowser(url: string): Promise<Page> {
    const domain = getDomain(url);

    // If already open to same domain, reuse
    if (this.context && this.page && this.currentDomain === domain) {
      this.resetIdleTimer();
      return this.page;
    }

    // Different domain or not open — close old and open new
    await this.close();

    const pw = await this.getPlaywright();
    const profileDir = getProfileDir(domain);

    this.context = await pw.chromium.launchPersistentContext(profileDir, {
      headless: false,
      viewport: { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });
    this.currentDomain = domain;

    // Use existing page or create one
    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
    this.resetIdleTimer();
    return this.page;
  }

  /** Navigate to URL. */
  async navigate(url: string): Promise<void> {
    const page = await this.ensureBrowser(url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
    // Give JS-rendered content a moment to load
    await page.waitForTimeout(1500);
    this.resetIdleTimer();
  }

  /** Wait for user to complete login — polls for URL/DOM changes. */
  async waitForUser(
    timeoutMs = 120_000,
    onStatus?: (msg: string) => void,
  ): Promise<void> {
    if (!this.page) throw new Error("No browser page open");

    const page = this.page;
    const startUrl = page.url();
    onStatus?.("Waiting for you to complete the action in the browser...");

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await page.waitForTimeout(2000);

      // Check if URL changed (user navigated away from login)
      const currentUrl = page.url();
      if (currentUrl !== startUrl) {
        await page.waitForTimeout(1500); // Let the new page settle
        this.resetIdleTimer();
        return;
      }

      // Check if login forms disappeared
      const hasLoginForm = await page.evaluate(() => {
        const inputs = document.querySelectorAll(
          'input[type="password"], input[name="password"]',
        );
        return inputs.length > 0;
      });
      if (!hasLoginForm) {
        await page.waitForTimeout(1000);
        this.resetIdleTimer();
        return;
      }
    }

    throw new Error("Timed out waiting for user action (2 minutes)");
  }

  /** Click an element by CSS selector or aria label. */
  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error("No browser page open");

    // Try CSS selector first, then aria label
    let locator = this.page.locator(selector).first();
    try {
      await locator.waitFor({ timeout: 5000 });
    } catch {
      // Fall back to aria-label match
      locator = this.page.getByLabel(selector).first();
      await locator.waitFor({ timeout: 5000 });
    }

    await locator.click();
    // Wait for potential navigation or content load
    await this.page
      .waitForLoadState("domcontentloaded", { timeout: 10_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1000);
    this.resetIdleTimer();
  }

  /** Scroll the page. */
  async scroll(
    direction: "down" | "up",
    amount = 600,
  ): Promise<void> {
    if (!this.page) throw new Error("No browser page open");
    const delta = direction === "down" ? amount : -amount;
    await this.page.mouse.wheel(0, delta);
    await this.page.waitForTimeout(1000);
    this.resetIdleTimer();
  }

  /** Type text into an input element. */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error("No browser page open");

    let locator = this.page.locator(selector).first();
    try {
      await locator.waitFor({ timeout: 5000 });
    } catch {
      locator = this.page.getByLabel(selector).first();
      await locator.waitFor({ timeout: 5000 });
    }

    await locator.click();
    await locator.fill(text);
    this.resetIdleTimer();
  }

  /** Take a screenshot as base64 PNG, resized to fit. */
  async screenshot(): Promise<string> {
    if (!this.page) throw new Error("No browser page open");
    const buffer = await this.page.screenshot({
      type: "jpeg",
      quality: 75,
      fullPage: false,
    });
    return buffer.toString("base64");
  }

  /** Get the accessibility tree as readable text using Playwright's ariaSnapshot. */
  async getAccessibilityTree(): Promise<string> {
    if (!this.page) throw new Error("No browser page open");
    try {
      const snapshot = await this.page.locator(":root").ariaSnapshot();
      if (!snapshot) return "(empty accessibility tree)";
      return truncateAriaSnapshot(snapshot);
    } catch {
      return "(accessibility tree unavailable)";
    }
  }

  /** Extract text content from the page, optionally filtered by selector. */
  async extractContent(selector?: string): Promise<string> {
    if (!this.page) throw new Error("No browser page open");

    let html: string;
    if (selector) {
      try {
        const el = this.page.locator(selector).first();
        html = await el.innerHTML({ timeout: 5000 });
      } catch {
        html = await this.page.content();
      }
    } else {
      html = await this.page.content();
    }

    const text = htmlToText(html);
    return text.length > MAX_TEXT_CHARS
      ? text.slice(0, MAX_TEXT_CHARS) + "\n[...truncated]"
      : text;
  }

  /** Get current page info. */
  getPageInfo(): { url: string; title: string } | null {
    if (!this.page) return null;
    return {
      url: this.page.url(),
      title: "", // Will be filled by buildToolResult
    };
  }

  /** Build combined tool result: screenshot + a11y tree + text. */
  async buildToolResult(opts?: {
    selector?: string;
  }): Promise<BrowseResult> {
    if (!this.page) throw new Error("No browser page open");

    const [screenshotB64, a11yTree, textContent, title] = await Promise.all([
      this.screenshot(),
      this.getAccessibilityTree(),
      this.extractContent(opts?.selector),
      this.page.title(),
    ]);

    return {
      pageUrl: this.page.url(),
      pageTitle: title,
      screenshot: screenshotB64,
      accessibilityTree: a11yTree,
      textContent,
    };
  }

  /** Convert BrowseResult into a MultipartToolResult for the chat pipeline. */
  static toMultipartResult(result: BrowseResult): MultipartToolResult {
    return {
      _multipart: true,
      text: [
        `Page: ${result.pageUrl}`,
        `Title: ${result.pageTitle}`,
        "",
        "## Accessibility Tree",
        result.accessibilityTree,
        "",
        "## Page Text",
        result.textContent,
      ].join("\n"),
      imageBase64: result.screenshot,
    };
  }

  /** Check if a browser session is currently open. */
  get isOpen(): boolean {
    return this.page !== null;
  }

  /** Close the browser and clean up. */
  async close(): Promise<void> {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.context) {
      try {
        await this.context.close();
      } catch {
        // ignore
      }
      this.context = null;
      this.page = null;
      this.currentDomain = null;
    }
  }
}

// Singleton per server process — browser sessions persist across tool calls
let _instance: BrowserSessionManager | null = null;

export function getBrowserSession(): BrowserSessionManager {
  if (!_instance) {
    _instance = new BrowserSessionManager();
    // Clean up on process exit
    const cleanup = () => {
      _instance?.close().catch(() => {});
      _instance = null;
    };
    process.on("exit", cleanup);
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  }
  return _instance;
}
