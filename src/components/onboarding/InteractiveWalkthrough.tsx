import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  KeyboardIcon,
  LinkSimpleIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ConnectionsContent } from "@/components/connections/ConnectionsContent";
import {
  ShortcutRow,
  useShortcutRecording,
  getShortcutDisplayValue,
} from "@/components/shortcuts/ShortcutRecorder";
import { saveWizardCompletedSteps, readWizardCompletedSteps } from "@/lib/wizard-storage";
import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/* ── Shared slide animation ──────────────────────────────────────────────── */

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -56 : 56, opacity: 0 }),
};

/* ── Dot navigation ──────────────────────────────────────────────────────── */

function DotNav({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "w-5 h-2 bg-foreground"
              : i < current
                ? "w-2 h-2 bg-foreground/40"
                : "w-2 h-2 bg-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Step: Configure shortcuts ───────────────────────────────────────────── */

function ShortcutsStep({ onAdvance }: { onAdvance: () => void }) {
  const {
    overlaySettings,
    recordingSlot,
    liveKeys,
    handleRecordShortcut,
    cancelRecording,
  } = useShortcutRecording();

  const isElectron = typeof window !== "undefined" && "electronAPI" in window;

  if (!isElectron) {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-indigo-500">
          <KeyboardIcon weight="duotone" className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Configure your shortcuts</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-[300px]">
            Global shortcuts are available in the desktop app. Your defaults are already set — you can adjust them anytime from Settings.
          </p>
        </div>
        <div className="w-full max-w-sm rounded-xl border bg-muted/30 p-4 text-left space-y-2">
          <ShortcutRow label="Voice assistant" description="Open the floating pill" value="Shift+Fn" onRecord={() => {}} isRecording={false} liveKeys={[]} onCancel={() => {}} />
          <ShortcutRow label="Dictation" description="Hold to inject speech" value="Fn" onRecord={() => {}} isRecording={false} liveKeys={[]} onCancel={() => {}} />
          <ShortcutRow label="Meeting recording" description="Toggle meeting recording" value="Shift+M" onRecord={() => {}} isRecording={false} liveKeys={[]} onCancel={() => {}} />
        </div>
        <Button onClick={onAdvance} className="gap-1.5">
          Looks good — continue
          <ArrowRightIcon className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center w-full">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-indigo-500">
        <KeyboardIcon weight="duotone" className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Configure your shortcuts</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-[300px]">
          Click a shortcut to record it — just press the key combo you want. Defaults are already set.
        </p>
      </div>

      <ul className="w-full max-w-sm space-y-3 text-left">
        {(["assistant", "dictation", "meeting"] as const).map((slot) => (
          <ShortcutRow
            key={slot}
            label={
              slot === "assistant"
                ? "Voice assistant"
                : slot === "dictation"
                  ? "Dictation"
                  : "Meeting recording"
            }
            description={
              slot === "assistant"
                ? "Open the floating pill to talk to the AI"
                : slot === "dictation"
                  ? "Hold to inject speech into any text field"
                  : "Toggle meeting recording"
            }
            value={getShortcutDisplayValue(slot, overlaySettings)}
            onRecord={() => void handleRecordShortcut(slot)}
            isRecording={recordingSlot === slot}
            liveKeys={liveKeys}
            onCancel={cancelRecording}
          />
        ))}
      </ul>

      <Button onClick={onAdvance} className="gap-1.5">
        Looks good — continue
        <ArrowRightIcon className="size-3.5" />
      </Button>
    </div>
  );
}

/* ── Step: Connect services ──────────────────────────────────────────────── */

type Connection = { provider: string };

function ConnectServicesStep({ onAdvance }: { onAdvance: () => void }) {
  const { data: connections = [] } = useQuery<Connection[]>({
    queryKey: ["connections"],
    queryFn: () =>
      fetch(`${API_URL}/api/connections`, { credentials: "include" }).then(
        (r) => (r.ok ? (r.json() as Promise<Connection[]>) : []),
      ),
    refetchInterval: 3000,
  });

  const anyConnected = connections.length > 0;

  return (
    <div className="flex flex-col items-center gap-5 text-center w-full">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-sky-500">
        <LinkSimpleIcon weight="duotone" className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Connect Gmail and Slack</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-[300px]">
          Sync your inbox to discover contacts and power email workflows. Connect Slack for automated notifications.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-xl border bg-muted/30 p-4">
        <ConnectionsContent compact embeddedInSettings />
      </div>

      <Button onClick={onAdvance} className="gap-1.5">
        {anyConnected ? "Connected — continue" : "Continue"}
        <ArrowRightIcon className="size-3.5" />
      </Button>
    </div>
  );
}

/* ── Step: Done ──────────────────────────────────────────────────────────── */

function DoneStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-primary">
        <SparkleIcon weight="duotone" className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">You're all set!</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
          Your workspace is ready. You can revisit setup anytime from the Help Center.
        </p>
      </div>
      <Button onClick={onFinish} className="gap-1.5">
        Go to Home
        <ArrowRightIcon className="size-3.5" />
      </Button>
    </div>
  );
}

/* ── Step definitions ────────────────────────────────────────────────────── */

const STEP_IDS = [
  "configure-shortcuts",
  "connect-services",
  "done",
] as const;

type StepId = (typeof STEP_IDS)[number];

/* ── Main component ──────────────────────────────────────────────────────── */

export interface InteractiveWalkthroughProps {
  onComplete: () => void;
  userId?: number | string | null;
  hasApiKey?: boolean;
}

export function InteractiveWalkthrough({
  onComplete,
  userId,
}: InteractiveWalkthroughProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [completedIds, setCompletedIds] = useState<StepId[]>([]);

  const currentStepId = STEP_IDS[stepIdx]!;

  const advance = useCallback(
    (doneId?: StepId) => {
      if (doneId) {
        setCompletedIds((prev) =>
          prev.includes(doneId) ? prev : [...prev, doneId],
        );
      }
      if (stepIdx < STEP_IDS.length - 1) {
        setDirection(1);
        setStepIdx((i) => i + 1);
      }
    },
    [stepIdx],
  );

  const back = useCallback(() => {
    if (stepIdx > 0) {
      setDirection(-1);
      setStepIdx((i) => i - 1);
    }
  }, [stepIdx]);

  const handleFinish = useCallback(() => {
    if (userId != null) {
      try {
        const existing = readWizardCompletedSteps(userId);
        const all = Array.from(
          new Set([...existing, ...completedIds, "done"]),
        );
        saveWizardCompletedSteps(userId, all);
      } catch {
        // ignore
      }
    }
    onComplete();
  }, [userId, completedIds, onComplete]);

  const isDone = currentStepId === "done";
  const isFirst = stepIdx === 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Top progress bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${((stepIdx + 1) / STEP_IDS.length) * 100}%` }}
        />
      </div>

      {/* Step counter label */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/60">
        Step {stepIdx + 1} of {STEP_IDS.length}
      </div>

      {/* Step content */}
      <div className="w-full max-w-md px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepIdx}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            {currentStepId === "configure-shortcuts" && (
              <ShortcutsStep
                onAdvance={() => advance("configure-shortcuts")}
              />
            )}
            {currentStepId === "connect-services" && (
              <ConnectServicesStep onAdvance={() => advance("connect-services")} />
            )}
            {currentStepId === "done" && <DoneStep onFinish={handleFinish} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      {!isDone && (
        <div className="absolute bottom-10 flex flex-col items-center gap-4">
          <DotNav total={STEP_IDS.length} current={stepIdx} />
          {!isFirst && (
            <Button variant="ghost" size="sm" onClick={back} className="gap-1.5">
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
