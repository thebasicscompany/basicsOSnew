import { useCallback, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import {
  ArrowUpIcon,
  ChatCircleIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useMe } from "@/hooks/use-me";
import { useGateway } from "@/hooks/useGateway";
import { useThreads } from "@/hooks/use-threads";
import {
  RecentsSection,
  RecentRecordsSection,
  RecentChatsSection,
  RecentRecordsFallbackSection,
} from "@/components/home/home-sections";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/* ------------------------------------------------------------------ */
/*  Greeting                                                          */
/* ------------------------------------------------------------------ */

const GREETINGS = [
  (name: string, tod: string) => `${tod}, ${name}.`,
  (name: string) => `Welcome back, ${name}.`,
  (name: string) => `What's on the agenda, ${name}?`,
  (name: string) => `Ready when you are, ${name}.`,
  (name: string) => `Let's make it happen, ${name}.`,
  (name: string) => `What can I help with, ${name}?`,
  (name: string, tod: string) => `${tod}, ${name}. What's next?`,
  (name: string) => `Hey ${name}, let's get to work.`,
];

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getGreeting(name: string) {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
  );
  const idx = dayOfYear % GREETINGS.length;
  return GREETINGS[idx]!(name, getTimeOfDay());
}

/* ------------------------------------------------------------------ */
/*  Home sections config                                              */
/*  Add, remove, or reorder sections here.                            */
/* ------------------------------------------------------------------ */

const HOME_SECTIONS = [
  { id: "recent-records", component: RecentRecordsSection },
  { id: "records-fallback", component: RecentRecordsFallbackSection },
  { id: "recents", component: RecentsSection },
  { id: "recent-chats", component: RecentChatsSection },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export function HomePage() {
  const { data: me } = useMe();
  const { hasKey } = useGateway();
  const { data: threads } = useThreads(1);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);

  const firstName = me?.firstName || me?.fullName?.split(" ")[0] || "there";
  const greeting = useMemo(() => getGreeting(firstName), [firstName]);
  const recentThread = threads?.[0] ?? null;

  const submitMessage = useCallback(async () => {
    const text = textareaRef.current?.value?.trim();
    if (!text) return;
    if (!hasKey) {
      toast.error(
        "Add your Basics API key in Settings to use the assistant",
      );
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      const res = await fetch(`${API_URL}/api/gateway-chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          channel: "chat",
        }),
      });
      const threadId = res.headers.get("X-Thread-Id");
      navigate(threadId ? `/chat/${threadId}` : "/chat");
    } catch {
      toast.error("Failed to start chat");
      submittingRef.current = false;
    }
  }, [hasKey, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitMessage();
      }
    },
    [submitMessage],
  );

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-16">
        {/* Greeting */}
        <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>

        {/* Chat section */}
        <div className="mt-5 space-y-2.5">
          {/* Recent chat pill */}
          {recentThread && (
            <Link
              to={`/chat/${recentThread.id}`}
              className="inline-flex items-center gap-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChatCircleIcon className="size-3.5" />
              <span>Recent chat</span>
              <span className="mx-0.5 text-border">·</span>
              <span className="font-medium text-foreground truncate max-w-[300px]">
                {recentThread.title ?? "Untitled"}
              </span>
            </Link>
          )}

          {/* Chat input */}
          <div className="relative rounded-xl border border-border bg-card shadow-sm focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <textarea
              ref={textareaRef}
              placeholder="Ask anything..."
              rows={3}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-xl bg-transparent px-4 pt-3 pb-12 text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                type="button"
                onClick={submitMessage}
                className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-80"
              >
                <ArrowUpIcon className="size-4" weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic sections */}
        <div className="mt-8 space-y-8">
          {HOME_SECTIONS.map(({ id, component: Section }) => (
            <Section key={id} />
          ))}
        </div>
      </div>
    </div>
  );
}
