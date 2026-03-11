import WebSocket from "ws";
import { randomUUID } from "crypto";

export interface GatewayResFrame {
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: string;
}

export interface AgentEvent {
  event: string;
  stream?: string;
  data?: unknown;
  globalSeq?: number;
  sessionKey?: string;
}

interface PendingRequest {
  resolve: (res: GatewayResFrame) => void;
  reject: (err: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export class GatewayWsClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private eventListeners: Array<(event: AgentEvent) => void> = [];
  private closeListeners: Array<(code: number, reason: string) => void> = [];
  private reconnectUrl: string | null = null;
  private reconnectAuth: { token?: string } | null = null;

  async open(url: string, auth?: { token?: string }): Promise<void> {
    this.reconnectUrl = url;
    this.reconnectAuth = auth ?? null;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("WS open timeout"));
      }, 8000);

      ws.once("open", async () => {
        clearTimeout(timeout);
        this.ws = ws;
        this.attachHandlers(ws);

        try {
          const connectRes = await this.request("connect", {
            minProtocol: 3,
            maxProtocol: 3,
            client: {
              id: "basicsos-server",
              version: "1.0",
              platform: process.platform,
              mode: "backend",
            },
            caps: ["tool-events"],
            ...(auth ? { auth } : {}),
          });

          if (!connectRes.ok) {
            ws.close();
            reject(new Error("Connect handshake failed"));
            return;
          }
          resolve();
        } catch (err) {
          ws.close();
          reject(err);
        }
      });

      ws.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async request(
    method: string,
    params?: unknown,
    timeoutMs = 12000,
  ): Promise<GatewayResFrame> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
      throw new Error("WS not connected");

    return new Promise((resolve, reject) => {
      const id = randomUUID();
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timeout });
      this.ws!.send(JSON.stringify({ type: "req", id, method, params }));
    });
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  onEvent(callback: (event: AgentEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onClose(callback: (code: number, reason: string) => void): () => void {
    this.closeListeners.push(callback);
    return () => {
      this.closeListeners = this.closeListeners.filter(
        (cb) => cb !== callback,
      );
    };
  }

  private attachHandlers(ws: WebSocket) {
    ws.on("message", (data) => {
      try {
        const frame = JSON.parse(data.toString());
        if (frame.type === "res") {
          const pending = this.pending.get(frame.id);
          if (pending) {
            this.pending.delete(frame.id);
            clearTimeout(pending.timeout);
            pending.resolve(frame);
          }
        } else if (frame.type === "event") {
          const event: AgentEvent = {
            event: frame.event,
            stream: frame.payload?.stream as string | undefined,
            data: frame.payload?.data,
            globalSeq: frame.payload?.globalSeq as number | undefined,
            sessionKey: frame.payload?.sessionKey as string | undefined,
          };
          this.eventListeners.forEach((cb) => cb(event));
        }
      } catch {
        // Ignore malformed frames
      }
    });

    ws.on("close", (code, reason) => {
      this.ws = null;
      // Reject all pending requests
      for (const [id, pending] of this.pending) {
        clearTimeout(pending.timeout);
        pending.reject(new Error(`WS closed: ${code}`));
        this.pending.delete(id);
      }
      this.closeListeners.forEach((cb) => cb(code, reason.toString()));
    });
  }

  close() {
    this.ws?.close();
    this.ws = null;
  }
}

// Singleton instance (survives HMR)
const _globalWsClients = ((
  globalThis as Record<string, unknown>
).__basicsos_wsClients ??= new Map<string, GatewayWsClient>()) as Map<
  string,
  GatewayWsClient
>;

export function getOrCreateWsClient(orgId: string): GatewayWsClient {
  let client = _globalWsClients.get(orgId);
  if (!client) {
    client = new GatewayWsClient();
    _globalWsClients.set(orgId, client);
  }
  return client;
}
