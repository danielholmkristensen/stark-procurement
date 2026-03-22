interface LiveIndicatorProps {
  label?: string;
  size?: "sm" | "md";
}

export function LiveIndicator({ label = "Live", size = "sm" }: LiveIndicatorProps) {
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const pingSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="relative flex">
        <span
          className={`animate-ping absolute inline-flex ${pingSize} rounded-full bg-green-400 opacity-75`}
        />
        <span className={`relative inline-flex ${dotSize} rounded-full bg-green-500`} />
      </span>
      {label}
    </div>
  );
}

export function StatusIndicator({
  status,
  label,
}: {
  status: "online" | "offline" | "warning" | "toggle";
  label?: string;
}) {
  // STARK Design: Green for online, Orange for attention states
  const colors = {
    online: "bg-green-500",
    offline: "bg-stark-orange",
    warning: "bg-stark-orange",
    toggle: "bg-stark-navy",
  };

  const showPing = status === "online";

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {showPing && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${colors[status]}`} />
      </span>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </div>
  );
}
