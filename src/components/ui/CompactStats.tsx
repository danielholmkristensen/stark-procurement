/**
 * Compact Stats Bar
 *
 * Replaces multiple stat cards with an inline, clickable stats row.
 * Follows Command Center principle: tighter spacing, filter on click.
 */

"use client";

interface StatItem {
  label: string;
  value: number;
  filter?: string;
  variant?: "default" | "success" | "warning" | "action";
}

interface CompactStatsProps {
  stats: StatItem[];
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

// Design System: All values in navy, success indicated by green dot
const variantStyles = {
  default: {
    value: "text-stark-navy",
    bg: "hover:bg-gray-50",
    active: "bg-stark-navy-10 ring-1 ring-stark-navy/20",
    showDot: false,
  },
  success: {
    value: "text-stark-navy",
    bg: "hover:bg-gray-50",
    active: "bg-gray-100 ring-1 ring-gray-300/30",
    showDot: true,
  },
  warning: {
    value: "text-stark-navy",
    bg: "hover:bg-gray-50",
    active: "bg-gray-100 ring-1 ring-gray-300/30",
    showDot: false,
  },
  action: {
    value: "text-stark-navy font-bold",
    bg: "hover:bg-gray-50",
    active: "bg-gray-100 ring-1 ring-gray-300/30",
    showDot: false,
  },
};

export function CompactStats({ stats, activeFilter, onFilterChange }: CompactStatsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg">
      {stats.map((stat, index) => {
        const variant = stat.variant ?? "default";
        const styles = variantStyles[variant];
        const isActive = activeFilter === stat.filter;
        const isClickable = !!stat.filter && !!onFilterChange;

        return (
          <button
            key={index}
            onClick={() => isClickable && onFilterChange(stat.filter!)}
            disabled={!isClickable}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-sm
              ${isClickable ? "cursor-pointer" : "cursor-default"}
              ${isActive ? styles.active : styles.bg}
              ${!isClickable && "opacity-90"}
            `}
          >
            {styles.showDot && (
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            )}
            <span className={`font-semibold tabular-nums ${styles.value}`}>
              {stat.value}
            </span>
            <span className="text-gray-500 text-xs">
              {stat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Vertical variant for sidebar/narrow contexts
export function CompactStatsVertical({ stats, activeFilter, onFilterChange }: CompactStatsProps) {
  return (
    <div className="flex flex-col gap-1 p-1 bg-gray-50 rounded-lg">
      {stats.map((stat, index) => {
        const variant = stat.variant ?? "default";
        const styles = variantStyles[variant];
        const isActive = activeFilter === stat.filter;
        const isClickable = !!stat.filter && !!onFilterChange;

        return (
          <button
            key={index}
            onClick={() => isClickable && onFilterChange(stat.filter!)}
            disabled={!isClickable}
            className={`
              flex items-center justify-between px-3 py-2 rounded-md transition-all text-sm
              ${isClickable ? "cursor-pointer" : "cursor-default"}
              ${isActive ? styles.active : styles.bg}
            `}
          >
            <span className="text-gray-600 text-xs">
              {stat.label}
            </span>
            <span className="flex items-center gap-1.5">
              {styles.showDot && (
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              )}
              <span className={`font-semibold tabular-nums ${styles.value}`}>
                {stat.value}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
