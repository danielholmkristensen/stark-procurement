/**
 * Guidance Banner
 *
 * Subtle, elegant notifications that guide without demanding.
 *
 * Design: Navy-based with minimal accents. Dismissible.
 * Escalation through left border, not colored text.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { X, ChevronRight } from "lucide-react";
import { Button } from "./Button";

type BannerVariant = "action" | "insight" | "info" | "success";

interface GuidanceBannerProps {
  variant?: BannerVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function GuidanceBanner({
  variant = "info",
  icon,
  title,
  description,
  action,
  dismissible = true,
  onDismiss,
}: GuidanceBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Elegant escalation through left border only
  const borderStyle = {
    action: "border-l-2 border-l-stark-orange",
    insight: "border-l-2 border-l-stark-navy/40",
    info: "border-l-2 border-l-gray-300",
    success: "border-l-2 border-l-green-500",
  }[variant];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${borderStyle} mb-3`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Icon - subtle navy */}
        {icon && (
          <div className="flex-shrink-0 text-stark-navy/60">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stark-navy">{title}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>

        {/* Action - subtle link style, not loud button */}
        {action && (
          action.href ? (
            <Link
              href={action.href}
              className="flex items-center gap-1 text-xs font-medium text-stark-navy hover:underline flex-shrink-0"
            >
              {action.label}
              <ChevronRight size={12} />
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="flex items-center gap-1 text-xs font-medium text-stark-navy hover:underline flex-shrink-0"
            >
              {action.label}
              <ChevronRight size={12} />
            </button>
          )
        )}

        {/* Dismiss */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Section Summary - Inline stats bar
 */
interface SectionSummaryProps {
  totalValue?: number;
  currency?: string;
  itemCount: number;
  oldestWaiting?: string;
  urgentCount?: number;
}

export function SectionSummary({
  totalValue,
  currency = "DKK",
  itemCount,
  oldestWaiting,
  urgentCount,
}: SectionSummaryProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 flex items-center gap-4">
      {totalValue !== undefined && (
        <span>
          <span className="font-medium text-stark-navy">{formatCurrency(totalValue)}</span> total
        </span>
      )}
      {oldestWaiting && (
        <span>
          Oldest: <span className="font-medium text-stark-navy">{oldestWaiting}</span>
        </span>
      )}
      {urgentCount !== undefined && urgentCount > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-stark-orange" />
          <span className="font-medium text-stark-navy">{urgentCount}</span> urgent
        </span>
      )}
    </div>
  );
}
