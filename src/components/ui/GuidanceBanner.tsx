/**
 * Guidance Banner
 *
 * Dynamic, actionable guidance text for list pages.
 * Tells the buyer what to do, not just what exists.
 */

"use client";

import Link from "next/link";
import { AlertTriangle, TrendingUp, Clock, Package, FileText, CheckCircle, Info } from "lucide-react";
import { Button } from "./Button";

type BannerVariant = "action" | "warning" | "info" | "success";

interface GuidanceBannerProps {
  variant: BannerVariant;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  stats?: Array<{ label: string; value: string | number }>;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const variantStyles: Record<BannerVariant, { container: string; icon: string; title: string }> = {
  action: {
    container: "bg-stark-orange-10 border-stark-orange/30",
    icon: "text-stark-orange",
    title: "text-stark-orange",
  },
  warning: {
    container: "bg-amber-50 border-amber-200",
    icon: "text-amber-600",
    title: "text-amber-800",
  },
  info: {
    container: "bg-gray-50 border-gray-200",
    icon: "text-gray-500",
    title: "text-gray-700",
  },
  success: {
    container: "bg-green-50 border-green-200",
    icon: "text-green-600",
    title: "text-green-800",
  },
};

const defaultIcons: Record<BannerVariant, React.ReactNode> = {
  action: <AlertTriangle size={20} />,
  warning: <Clock size={20} />,
  info: <Info size={20} />,
  success: <CheckCircle size={20} />,
};

export function GuidanceBanner({
  variant,
  icon,
  title,
  description,
  stats,
  action,
  secondaryAction,
}: GuidanceBannerProps) {
  const styles = variantStyles[variant];
  const displayIcon = icon ?? defaultIcons[variant];

  return (
    <div className={`rounded-lg border p-4 mb-4 ${styles.container}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
            {displayIcon}
          </div>
          <div>
            <p className={`font-semibold ${styles.title}`}>{title}</p>
            {description && (
              <p className="text-sm text-gray-600 mt-0.5">{description}</p>
            )}
            {stats && stats.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {stats.map((stat, i) => (
                  <span key={i} className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{stat.value}</span> {stat.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {(action || secondaryAction) && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {secondaryAction && (
              secondaryAction.href ? (
                <Link href={secondaryAction.href}>
                  <Button variant="outline" size="sm">
                    {secondaryAction.label}
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )
            )}
            {action && (
              action.href ? (
                <Link href={action.href}>
                  <Button variant={variant === "action" ? "action" : "primary"} size="sm">
                    {action.label}
                  </Button>
                </Link>
              ) : (
                <Button variant={variant === "action" ? "action" : "primary"} size="sm" onClick={action.onClick}>
                  {action.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Section Summary Banner
 *
 * Inline summary for expanded sections showing totals and context.
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
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 flex items-center gap-4">
      {totalValue !== undefined && (
        <span>
          <span className="font-medium text-gray-700">{formatCurrency(totalValue)}</span> total
        </span>
      )}
      {oldestWaiting && (
        <span>
          Oldest: <span className="font-medium text-gray-700">{oldestWaiting}</span>
        </span>
      )}
      {urgentCount !== undefined && urgentCount > 0 && (
        <span className="text-stark-orange">
          <span className="font-medium">{urgentCount}</span> urgent
        </span>
      )}
    </div>
  );
}
