import { type ReactNode, useMemo } from "react";
import { Link } from "react-router";
import type { ComponentType } from "react";
import {
  ArrowRightIcon,
  ChatCircleIcon,
  ClockIcon,
  LightningIcon,
  RobotIcon,
  UserPlusIcon,
  HandshakeIcon,
  PencilSimpleIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  SpinnerGapIcon,
  NoteIcon,
} from "@phosphor-icons/react";
import { useRecentItems } from "@/hooks/use-recent-items";
import { useThreads, type Thread } from "@/hooks/use-threads";
import { useRecords } from "@/hooks/use-records";
import { useObjects } from "@/hooks/use-object-registry";
import { getObjectIcon } from "@/lib/object-icon-map";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Shared UI                                                         */
/* ------------------------------------------------------------------ */

const TYPE_TO_SLUG: Record<string, string> = {
  contact: "contacts",
  company: "companies",
  deal: "deals",
};

const TYPE_ACCENT: Record<string, string> = {
  contact: "bg-blue-500/10 text-blue-400",
  company: "bg-violet-500/10 text-violet-400",
  deal: "bg-emerald-500/10 text-emerald-400",
};

function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">
          {title}
        </p>
        {count != null && count > 0 && (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

function SectionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      <ArrowRightIcon className="size-3" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity feed types                                               */
/* ------------------------------------------------------------------ */

type ActivityKind =
  | "agent_chat"
  | "automation_success"
  | "automation_error"
  | "automation_running"
  | "record_created"
  | "record_updated"
  | "note_added";

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  timestamp: string;
  href?: string;
}

const ACTIVITY_META: Record<
  ActivityKind,
  {
    icon: ComponentType<{ className?: string; weight?: string }>;
    accent: string;
    statusColor?: string;
  }
> = {
  agent_chat: {
    icon: RobotIcon,
    accent: "bg-primary/10 text-primary",
  },
  automation_success: {
    icon: LightningIcon,
    accent: "bg-emerald-500/10 text-emerald-400",
    statusColor: "bg-emerald-400",
  },
  automation_error: {
    icon: WarningCircleIcon,
    accent: "bg-red-500/10 text-red-400",
    statusColor: "bg-red-400",
  },
  automation_running: {
    icon: SpinnerGapIcon,
    accent: "bg-amber-500/10 text-amber-400",
    statusColor: "bg-amber-400",
  },
  record_created: {
    icon: UserPlusIcon,
    accent: "bg-blue-500/10 text-blue-400",
  },
  record_updated: {
    icon: PencilSimpleIcon,
    accent: "bg-violet-500/10 text-violet-400",
  },
  note_added: {
    icon: NoteIcon,
    accent: "bg-orange-500/10 text-orange-400",
  },
};

/* ------------------------------------------------------------------ */
/*  Section: Recents (activity feed)                                  */
/* ------------------------------------------------------------------ */

// Set to true to preview the Recents section with mock data
const USE_MOCK_ACTIVITY = true;

const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "mock-1",
    kind: "agent_chat",
    title: "Summarized pipeline for Q1",
    detail: "AI Chat",
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    href: "/chat",
  },
  {
    id: "mock-2",
    kind: "automation_success",
    title: "Welcome email to new leads",
    detail: "Completed",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    href: "/automations",
  },
  {
    id: "mock-3",
    kind: "record_created",
    title: "Sarah Chen",
    detail: "Contact created",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    href: "/objects/contacts/1",
  },
  {
    id: "mock-4",
    kind: "automation_error",
    title: "Slack notification on deal close",
    detail: "Webhook timeout after 30s",
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    href: "/automations",
  },
  {
    id: "mock-5",
    kind: "record_updated",
    title: "Acme Corp — Enterprise Plan",
    detail: "Deal stage changed to Negotiation",
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    href: "/objects/deals/1",
  },
  {
    id: "mock-6",
    kind: "agent_chat",
    title: "Draft follow-up for Johnson & Co",
    detail: "AI Chat",
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    href: "/chat",
  },
];

interface AutomationRun {
  id: number;
  ruleId: number;
  status: string;
  result?: unknown;
  error?: string;
  startedAt: string;
  finishedAt?: string;
  ruleName?: string;
}

function useActivityFeed(): { items: ActivityItem[]; isLoading: boolean } {
  // Preview mode — return mock data
  if (USE_MOCK_ACTIVITY) {
    return { items: MOCK_ACTIVITY, isLoading: false };
  }

  // Automation runs
  const { data: automationRuns, isLoading: loadingRuns } = useQuery({
    queryKey: ["home-automation-runs"],
    queryFn: () =>
      fetchApi<AutomationRun[]>("/api/automation-runs?limit=5&sort=desc"),
    staleTime: 30_000,
  });

  // Recent AI threads
  const { data: threads, isLoading: loadingThreads } = useThreads(3);

  // Recent CRM records across objects (contacts, deals, companies)
  const { data: contactsData } = useRecords("contacts", {
    page: 1,
    perPage: 3,
    sort: { field: "created_at", order: "DESC" },
  });
  const { data: dealsData } = useRecords("deals", {
    page: 1,
    perPage: 3,
    sort: { field: "created_at", order: "DESC" },
  });

  const items = useMemo(() => {
    const feed: ActivityItem[] = [];

    // AI chat threads → agent_chat
    for (const t of threads ?? []) {
      if (t.channel !== "chat") continue;
      feed.push({
        id: `thread-${t.id}`,
        kind: "agent_chat",
        title: t.title ?? "AI conversation",
        detail: "AI Chat",
        timestamp: t.updatedAt,
        href: `/chat/${t.id}`,
      });
    }

    // Automation runs → automation_success/error/running
    for (const run of automationRuns ?? []) {
      const kind: ActivityKind =
        run.status === "success"
          ? "automation_success"
          : run.status === "error"
            ? "automation_error"
            : "automation_running";
      feed.push({
        id: `run-${run.id}`,
        kind,
        title: run.ruleName ?? `Automation #${run.ruleId}`,
        detail:
          run.status === "error"
            ? run.error?.slice(0, 60) ?? "Failed"
            : run.status === "running"
              ? "In progress..."
              : "Completed",
        timestamp: run.finishedAt ?? run.startedAt,
        href: "/automations",
      });
    }

    // Recently created contacts → record_created
    for (const r of (contactsData?.data ?? []).slice(0, 2)) {
      const rec = r as Record<string, unknown>;
      const id = rec.Id as number;
      const name =
        (rec.FullName ?? rec.full_name ?? rec.Name ?? rec.name ?? "") as string;
      const createdAt = (rec.created_at ?? rec.CreatedAt ?? "") as string;
      if (!name || !createdAt) continue;
      feed.push({
        id: `contact-${id}`,
        kind: "record_created",
        title: name,
        detail: "Contact created",
        timestamp: createdAt,
        href: `/objects/contacts/${id}`,
      });
    }

    // Recently created deals → record_created
    for (const r of (dealsData?.data ?? []).slice(0, 2)) {
      const rec = r as Record<string, unknown>;
      const id = rec.Id as number;
      const name = (rec.Name ?? rec.name ?? rec.Title ?? rec.title ?? "") as string;
      const createdAt = (rec.created_at ?? rec.CreatedAt ?? "") as string;
      if (!name || !createdAt) continue;
      feed.push({
        id: `deal-${id}`,
        kind: "record_created",
        title: name,
        detail: "Deal created",
        timestamp: createdAt,
        href: `/objects/deals/${id}`,
      });
    }

    // Sort all by timestamp descending
    feed.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Deduplicate by id
    const seen = new Set<string>();
    return feed.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 6);
  }, [threads, automationRuns, contactsData, dealsData]);

  return { items, isLoading: loadingRuns || loadingThreads };
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = ACTIVITY_META[item.kind];
  const Icon = meta.icon;
  const timeAgo = getTimeAgo(item.timestamp);

  const content = (
    <div className="group flex items-start gap-3 rounded-lg px-3.5 py-2.5 transition-all hover:bg-accent/50">
      <div
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${meta.accent}`}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm">{item.title}</p>
          {meta.statusColor && (
            <span
              className={`size-1.5 shrink-0 rounded-full ${meta.statusColor}`}
            />
          )}
        </div>
        {item.detail && (
          <p className="truncate text-[11px] text-muted-foreground">
            {item.detail}
          </p>
        )}
      </div>
      <span className="mt-0.5 shrink-0 text-[11px] text-muted-foreground">
        {timeAgo}
      </span>
    </div>
  );

  if (item.href) {
    return <Link to={item.href}>{content}</Link>;
  }
  return content;
}

export function RecentsSection() {
  const { items, isLoading } = useActivityFeed();

  if (isLoading && items.length === 0) {
    return (
      <div className="space-y-3">
        <SectionHeader title="Recents" />
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-3.5 py-2.5"
            >
              <div className="size-7 shrink-0 animate-pulse rounded-md bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader title="Recents" />
      <div className="-mx-3.5 divide-y divide-border/50">
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Continue Working On (recently visited CRM records)       */
/* ------------------------------------------------------------------ */

export function RecentRecordsSection() {
  const [recentItems] = useRecentItems();
  const objects = useObjects();

  if (recentItems.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader title="Continue Working On" />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {recentItems.slice(0, 4).map((item) => {
          const slug = TYPE_TO_SLUG[item.type] ?? item.type;
          const accent =
            TYPE_ACCENT[item.type] ?? "bg-muted text-muted-foreground";
          const obj = objects.find((o) => o.slug === slug);
          const Icon = obj ? getObjectIcon(obj.icon) : getObjectIcon("user");

          return (
            <Link
              key={`${item.type}-${item.id}`}
              to={`/objects/${slug}/${item.id}`}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 transition-all hover:border-muted-foreground/25 hover:bg-accent"
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-md ${accent}`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {item.type}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Recent chat threads                                      */
/* ------------------------------------------------------------------ */

export function RecentChatsSection() {
  const { data: threads } = useThreads(5);
  const recentThreads = (threads ?? [])
    .filter((t) => t.channel === "chat")
    .slice(0, 3);

  if (recentThreads.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Recent Chats"
        count={recentThreads.length}
        action={<SectionLink to="/chat" label="New chat" />}
      />
      <div className="space-y-1.5">
        {recentThreads.map((thread) => (
          <ThreadRow key={thread.id} thread={thread} />
        ))}
      </div>
    </div>
  );
}

function ThreadRow({ thread }: { thread: Thread }) {
  const timeAgo = getTimeAgo(thread.updatedAt);
  return (
    <Link
      to={`/chat/${thread.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 transition-all hover:border-muted-foreground/25 hover:bg-accent"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <ChatCircleIcon className="size-4" />
      </div>
      <p className="min-w-0 flex-1 truncate text-sm">
        {thread.title ?? "Untitled chat"}
      </p>
      <div className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        <ClockIcon className="size-3" />
        {timeAgo}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Section: Fallback — show recent CRM records when nothing visited  */
/* ------------------------------------------------------------------ */

export function RecentRecordsFallbackSection() {
  const [recentItems] = useRecentItems();
  const { data: threads } = useThreads(1);
  const hasActivity = recentItems.length > 0 || (threads ?? []).length > 0;

  if (hasActivity) return null;

  return (
    <>
      <ObjectRecordsRow slug="contacts" label="Recent Contacts" />
      <ObjectRecordsRow slug="deals" label="Recent Deals" />
      <ObjectRecordsRow slug="companies" label="Recent Companies" />
    </>
  );
}

function ObjectRecordsRow({ slug, label }: { slug: string; label: string }) {
  const objects = useObjects();
  const obj = objects.find((o) => o.slug === slug);
  const Icon = obj ? getObjectIcon(obj.icon) : getObjectIcon("user");
  const accent =
    slug === "contacts"
      ? "bg-blue-500/10 text-blue-400"
      : slug === "companies"
        ? "bg-violet-500/10 text-violet-400"
        : "bg-emerald-500/10 text-emerald-400";

  const { data } = useRecords(slug, {
    page: 1,
    perPage: 4,
    sort: { field: "updated_at", order: "DESC" },
  });
  const records = data?.data ?? [];

  if (records.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader
        title={label}
        count={data?.total}
        action={<SectionLink to={`/objects/${slug}`} label="View all" />}
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {records.map((r) => {
          const rec = r as Record<string, unknown>;
          const id = rec.Id as number;
          const name = (rec.Name ??
            rec.name ??
            rec.FullName ??
            rec.full_name ??
            rec.Title ??
            rec.title ??
            "Unnamed") as string;
          return (
            <Link
              key={id}
              to={`/objects/${slug}/${id}`}
              className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 transition-all hover:border-muted-foreground/25 hover:bg-accent"
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-md ${accent}`}
              >
                <Icon className="size-4" />
              </div>
              <p className="min-w-0 truncate text-sm font-medium">{name}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}
