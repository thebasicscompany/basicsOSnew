import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChatCircleIcon,
  UsersIcon,
  GitBranchIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import basicsIcon from "@/assets/basicos-icon.png";

/* ── Slide definitions ──────────────────────────────────────────────────── */

type Slide = {
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
};

const SLIDES: Slide[] = [
  {
    icon: ChatCircleIcon,
    color: "text-blue-500",
    title: "AI assistant and voice",
    description:
      "Chat with an AI that knows your CRM — create contacts, summarize deals, draft follow-ups. Use the floating voice pill to talk hands-free from anywhere, or dictate text into any field.",
  },
  {
    icon: UsersIcon,
    color: "text-emerald-500",
    title: "Your CRM and email",
    description:
      "Contacts, companies, and deals are fully interconnected. Connect Gmail to sync your inbox, auto-discover contacts, and power email-based workflows. Tasks and notes stay tied to every record.",
  },
  {
    icon: GitBranchIcon,
    color: "text-amber-500",
    title: "Automations and shortcuts",
    description:
      "Build workflows triggered by CRM events — a deal changing stage, a new contact added, or a meeting completing. Use global keyboard shortcuts to access every feature without touching the mouse.",
  },
];

/* ── Dot indicator ──────────────────────────────────────────────────────── */

function DotNav({
  total,
  current,
  onDotClick,
}: {
  total: number;
  current: number;
  onDotClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onDotClick(i)}
          aria-label={`Go to slide ${i + 1}`}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "w-5 h-2 bg-foreground"
              : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Slide card ─────────────────────────────────────────────────────────── */

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 56 : -56,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -56 : 56,
    opacity: 0,
  }),
};

/* ── Main component ─────────────────────────────────────────────────────── */

export interface FullScreenOnboardingProps {
  onComplete: () => void;
  onStartTour?: () => void;
  userId?: number | string | null;
  isAdmin?: boolean;
  hasApiKey?: boolean;
}

export function FullScreenOnboarding({
  onComplete,
  onStartTour,
}: FullScreenOnboardingProps) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [direction, setDirection] = useState(1);

  const isFirst = slideIdx === 0;
  const isLast = slideIdx === SLIDES.length - 1;
  const slide = SLIDES[slideIdx]!;
  const Icon = slide.icon;

  const goTo = (idx: number) => {
    setDirection(idx > slideIdx ? 1 : -1);
    setSlideIdx(idx);
  };

  const next = () => {
    if (!isLast) goTo(slideIdx + 1);
  };

  const prev = () => {
    if (!isFirst) goTo(slideIdx - 1);
  };

  const handleStartSetup = () => {
    onComplete();
    onStartTour?.();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Skip button */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-7 right-7 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip
      </button>

      {/* Logo */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <img src={basicsIcon} alt="BasicsOS" className="h-7 w-7 object-contain" />
        <span className="text-sm font-semibold tracking-tight">BasicsOS</span>
      </div>

      {/* Slide area */}
      <div className="w-full max-w-sm px-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slideIdx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon */}
            <div
              className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted ${slide.color}`}
            >
              <Icon weight="duotone" className="h-8 w-8" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-semibold tracking-tight">
              {slide.title}
            </h2>

            {/* Description */}
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-[300px]">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation row */}
      <div className="absolute bottom-10 flex flex-col items-center gap-5">
        {/* Dot indicators */}
        <DotNav
          total={SLIDES.length}
          current={slideIdx}
          onDotClick={goTo}
        />

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {!isFirst && (
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              className="gap-1.5"
            >
              <ArrowLeftIcon className="size-3.5" />
              Back
            </Button>
          )}

          {isLast ? (
            <Button onClick={handleStartSetup} className="gap-1.5">
              Set up your workspace
              <ArrowRightIcon className="size-3.5" />
            </Button>
          ) : (
            <Button onClick={next} className="gap-1.5">
              Next
              <ArrowRightIcon className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Slide counter */}
        <span className="text-xs text-muted-foreground/60">
          {slideIdx + 1} of {SLIDES.length}
        </span>
      </div>
    </div>
  );
}
