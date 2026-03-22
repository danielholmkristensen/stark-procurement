/**
 * Collapsible Section
 *
 * Groups list items by state with expand/collapse functionality.
 * Follows Command Center pattern: urgent sections expanded by default,
 * lower-priority sections collapsed.
 */

"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { EscalationLevel } from "@/lib/db";

interface CollapsibleSectionProps {
  title: string;
  count: number;
  children: ReactNode;
  defaultExpanded?: boolean;
  escalationLevel?: EscalationLevel;
  variant?: "default" | "compact";
}

const escalationStyles: Record<EscalationLevel, string> = {
  urgent: "border-l-2 border-l-stark-orange bg-stark-orange-10/30",
  action: "border-l-2 border-l-stark-orange/60",
  attention: "border-l-2 border-l-stark-orange/30",
  awareness: "border-l-2 border-l-stark-navy/30",
  ambient: "",
};

export function CollapsibleSection({
  title,
  count,
  children,
  defaultExpanded = false,
  escalationLevel,
  variant = "default",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (count === 0) return null;

  const sectionClass = escalationLevel ? escalationStyles[escalationLevel] : "";
  const paddingClass = variant === "compact" ? "p-2" : "p-3";

  return (
    <div className={`rounded-lg border border-gray-200 overflow-hidden ${sectionClass}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between ${paddingClass} bg-gray-50 hover:bg-gray-100 transition-colors`}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={16} className="text-gray-500" />
          ) : (
            <ChevronRight size={16} className="text-gray-500" />
          )}
          <span className="font-medium text-sm text-gray-900">{title}</span>
          <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
            {count}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

// Helper to determine default expansion based on escalation
export function shouldExpandByDefault(level: EscalationLevel): boolean {
  return level === "urgent" || level === "action";
}
