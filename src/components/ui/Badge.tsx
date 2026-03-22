import { type ReactNode } from "react";

type BadgeVariant = "source" | "status" | "scope" | "count";
type SourceType = "relex" | "ecom" | "aspect4" | "salesapp" | "manual";
type StatusColorVariant = "default" | "primary" | "success" | "warning" | "danger" | "error" | "info";
type ScopeType = "current" | "toggle" | "future";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  source?: SourceType;
  colorVariant?: StatusColorVariant;
  scope?: ScopeType;
  className?: string;
}

export function Badge({
  children,
  variant = "source",
  source,
  colorVariant = "default",
  scope,
  className = "",
}: BadgeProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium";

  if (variant === "source") {
    return (
      <span className={`${baseClasses} px-2 py-0.5 rounded text-xs bg-gray-100 text-stark-navy border border-gray-200 ${className}`}>
        {children}
      </span>
    );
  }

  if (variant === "status") {
    // STARK Design System: Navy 80%, Green 15% (success only), Orange 5% (action required only)
    // No purple, blue, red, teal, amber
    const variantClasses: Record<StatusColorVariant, string> = {
      default: "bg-gray-100 text-gray-700",
      primary: "bg-stark-navy text-white",
      success: "bg-green-100 text-green-800",
      warning: "bg-stark-orange-10 text-stark-navy border border-stark-orange/30",
      danger: "bg-stark-orange-10 text-stark-navy border border-stark-orange/30",
      error: "bg-stark-orange-10 text-stark-navy border border-stark-orange/30",
      info: "bg-stark-navy-10 text-stark-navy",
    };
    const statusClass = variantClasses[colorVariant];
    return (
      <span className={`${baseClasses} px-2 py-0.5 rounded-full text-xs ${statusClass} ${className}`}>
        {children}
      </span>
    );
  }

  if (variant === "scope") {
    const scopeClasses: Record<ScopeType, string> = {
      current: "bg-scope-current-bg text-scope-current-text border border-scope-current-border",
      toggle: "bg-scope-toggle-bg text-scope-toggle-text border border-scope-toggle-border",
      future: "bg-scope-future-bg text-scope-future-text border border-scope-future-border",
    };
    const scopeClass = scope ? scopeClasses[scope] : scopeClasses.current;
    return (
      <span className={`${baseClasses} px-2 py-1 rounded text-xs ${scopeClass} ${className}`}>
        {children}
      </span>
    );
  }

  if (variant === "count") {
    return (
      <span className={`${baseClasses} min-w-[20px] h-5 px-1.5 bg-stark-navy text-white text-[11px] rounded-full ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`${baseClasses} px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 ${className}`}>
      {children}
    </span>
  );
}

export function SourceBadge({ source }: { source: SourceType }) {
  const labels: Record<SourceType, string> = {
    relex: "Relex",
    ecom: "ECom",
    aspect4: "Aspect4",
    salesapp: "SalesApp",
    manual: "Manual",
  };
  return <Badge variant="source">{labels[source] || source}</Badge>;
}

interface StatusBadgeProps {
  status: string;
  variant?: StatusColorVariant;
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  return (
    <Badge variant="status" colorVariant={variant}>
      {status}
    </Badge>
  );
}
