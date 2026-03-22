import { type ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  progress?: {
    value: number;
    max?: number;
  };
  alert?: {
    count: number;
    label: string;
  };
  breakdown?: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  progress,
  alert,
  breakdown,
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-500">{title}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.direction === "up"
                ? "text-green-700"
                : trend.direction === "down"
                ? "text-stark-navy"
                : "text-stark-navy"
            }`}
          >
            {trend.direction === "up" && "↑ "}
            {trend.direction === "down" && "↓ "}
            {trend.value}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-stark-navy">{value}</span>
        {subtitle && <span className="text-sm text-gray-400">{subtitle}</span>}
      </div>

      {progress && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden mr-3">
            <div
              className="h-full bg-stark-navy rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress.value, 100)}%` }}
            />
          </div>
          {alert && (
            <span className="text-xs text-stark-orange font-medium">
              {alert.count} {alert.label}
            </span>
          )}
        </div>
      )}

      {breakdown && (
        <div className="mt-3 flex gap-3 text-xs text-gray-400">
          {breakdown.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color || "#001e41" }}
              />
              {item.label} {item.value}
            </span>
          ))}
        </div>
      )}

      {!progress && !breakdown && subtitle && (
        <div className="mt-3 text-xs text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}
