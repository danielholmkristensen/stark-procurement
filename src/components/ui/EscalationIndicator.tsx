/**
 * Lindstrøm Escalation Hierarchy - Visual Indicators
 *
 * Orange is earned, not default. Visual intensity increases with urgency.
 *
 * Levels:
 * - Ambient: New/unread - barely there (small navy dot)
 * - Awareness: Items pending - when you have a moment (navy badge)
 * - Attention: Needs review - this needs your eyes (subtle orange tint)
 * - Action: Do this now - clear call to action (orange accent)
 * - Urgent: Time-critical - most prominent (pulsing orange)
 */

import type { EscalationLevel } from "@/lib/db";

interface EscalationIndicatorProps {
  level: EscalationLevel;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const levelConfig: Record<EscalationLevel, {
  label: string;
  description: string;
  dotClass: string;
  badgeClass: string;
  cardClass: string;
  pulse?: boolean;
}> = {
  ambient: {
    label: "New",
    description: "New/unread",
    dotClass: "bg-stark-navy/40",
    badgeClass: "bg-gray-100 text-gray-600",
    cardClass: "border-gray-200",
    pulse: false,
  },
  awareness: {
    label: "Pending",
    description: "When you have a moment",
    dotClass: "bg-stark-navy",
    badgeClass: "bg-stark-navy-10 text-stark-navy",
    cardClass: "border-gray-200",
    pulse: false,
  },
  attention: {
    label: "Review",
    description: "Needs your attention",
    dotClass: "bg-stark-orange/60",
    badgeClass: "bg-stark-orange-10 text-stark-navy border border-stark-orange/20",
    cardClass: "border-stark-orange/20 bg-stark-orange-10/30",
    pulse: false,
  },
  action: {
    label: "Action",
    description: "Do this now",
    dotClass: "bg-stark-orange",
    badgeClass: "bg-stark-orange-10 text-stark-orange border border-stark-orange/30",
    cardClass: "border-stark-orange/30 bg-stark-orange-10/50",
    pulse: false,
  },
  urgent: {
    label: "Urgent",
    description: "Time-critical",
    dotClass: "bg-stark-orange",
    badgeClass: "bg-stark-orange text-white",
    cardClass: "border-stark-orange bg-stark-orange-10",
    pulse: true,
  },
};

export function EscalationIndicator({ level, showLabel = false, size = "sm" }: EscalationIndicatorProps) {
  const config = levelConfig[level];
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex">
        {config.pulse && (
          <span className={`animate-ping absolute inline-flex ${dotSize} rounded-full bg-stark-orange opacity-75`} />
        )}
        <span className={`relative inline-flex ${dotSize} rounded-full ${config.dotClass}`} />
      </span>
      {showLabel && (
        <span className="text-xs text-gray-500">{config.label}</span>
      )}
    </div>
  );
}

export function EscalationBadge({ level }: { level: EscalationLevel }) {
  const config = levelConfig[level];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.badgeClass}`}>
      {config.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
      )}
      {config.label}
    </span>
  );
}

export function getEscalationCardClass(level: EscalationLevel): string {
  return levelConfig[level].cardClass;
}

export function getEscalationBadgeClass(level: EscalationLevel): string {
  return levelConfig[level].badgeClass;
}
