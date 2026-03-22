/**
 * Linked PRs Badge
 *
 * Shows PO's linked PRs count with expandable popover showing PR details.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import type { PurchaseRequest } from "@/lib/db";
import { SourceBadge } from "./Badge";

interface LinkedPRsBadgeProps {
  prIds: string[];
  prs?: PurchaseRequest[];
  size?: "sm" | "md";
}

export function LinkedPRsBadge({ prIds, prs = [], size = "sm" }: LinkedPRsBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const count = prIds.length;
  const iconSize = size === "sm" ? 12 : 14;
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExpanded]);

  if (count === 0) {
    return (
      <span className={`${textSize} text-gray-400`}>—</span>
    );
  }

  // Filter available PRs from the provided list
  const linkedPRs = prs.filter((pr) => prIds.includes(pr.id));

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`inline-flex items-center gap-1 ${padding} ${textSize} font-medium rounded bg-stark-navy-10 text-stark-navy hover:bg-stark-navy-20 transition-colors`}
      >
        <FileText size={iconSize} />
        <span>{count} PR{count !== 1 ? "s" : ""}</span>
        {count > 0 && (
          isExpanded ? (
            <ChevronUp size={iconSize} />
          ) : (
            <ChevronDown size={iconSize} />
          )
        )}
      </button>

      {isExpanded && linkedPRs.length > 0 && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 min-w-64 max-w-80"
        >
          <div className="p-2 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500 uppercase">
              Linked Purchase Requests
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {linkedPRs.map((pr) => (
              <LinkedPRRow key={pr.id} pr={pr} />
            ))}
          </div>
          {linkedPRs.length < count && (
            <div className="p-2 border-t border-gray-100 text-xs text-gray-400 text-center">
              {count - linkedPRs.length} more PR{count - linkedPRs.length !== 1 ? "s" : ""} (data loading...)
            </div>
          )}
        </div>
      )}

      {isExpanded && linkedPRs.length === 0 && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3"
        >
          <span className="text-xs text-gray-400">PR details loading...</span>
        </div>
      )}
    </div>
  );
}

function LinkedPRRow({ pr }: { pr: PurchaseRequest }) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <Link
      href={`/prs/${pr.id}`}
      className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-stark-navy">{pr.prNumber}</span>
        <SourceBadge source={pr.source} />
      </div>
      <span className="text-xs text-gray-500">{formatCurrency(pr.totalEstimatedValue)}</span>
    </Link>
  );
}
