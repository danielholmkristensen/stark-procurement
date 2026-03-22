/**
 * Linkage Status Badge
 *
 * Shows PR→PO linkage status: Unlinked, Direct (→ PO-1234), or Bundled (3)
 */

"use client";

import Link from "next/link";
import { Link2, Link2Off, Package } from "lucide-react";
import type { POLinkageInfo } from "@/lib/grouping";

interface LinkageStatusBadgeProps {
  linkage: POLinkageInfo;
  size?: "sm" | "md";
}

export function LinkageStatusBadge({ linkage, size = "sm" }: LinkageStatusBadgeProps) {
  const iconSize = size === "sm" ? 12 : 14;
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  if (linkage.status === "unlinked") {
    return (
      <span
        className={`inline-flex items-center gap-1 ${padding} ${textSize} font-medium rounded bg-gray-100 text-gray-500`}
      >
        <Link2Off size={iconSize} />
        <span>Unlinked</span>
      </span>
    );
  }

  if (linkage.status === "direct") {
    return (
      <Link
        href={`/pos/${linkage.poId}`}
        className={`inline-flex items-center gap-1 ${padding} ${textSize} font-medium rounded bg-stark-navy-10 text-stark-navy hover:bg-stark-navy-20 transition-colors`}
      >
        <Link2 size={iconSize} />
        <span>→ {linkage.poNumber}</span>
      </Link>
    );
  }

  // Bundled
  return (
    <span
      className={`inline-flex items-center gap-1 ${padding} ${textSize} font-medium rounded bg-stark-navy-10 text-stark-navy`}
      title={`Bundled with ${linkage.bundleCount} items`}
    >
      <Package size={iconSize} />
      <span>Bundled ({linkage.bundleCount})</span>
    </span>
  );
}
