/**
 * Handle Now Queue
 *
 * Collapsed by default with elegant attention indicator.
 * Visual weight scales with urgency level.
 *
 * Escalation:
 * - None: Green dot, calm
 * - Has items: Orange left accent
 * - Critical: Orange border + pulsing + tinted background
 */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePurchaseOrders, useInvoices } from "@/hooks";
import { Button } from "@/components/ui";

type Urgency = "critical" | "high" | "medium";

interface ActionItem {
  id: string;
  label: string;
  ref: string;
  supplier: string;
  detail: string;
  urgency: Urgency;
  href: string;
  action: string;
}

export function ActionItemsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const formatK = (v: number) => v >= 1000 ? `${Math.round(v / 1000)}K` : v.toString();

  const items = useMemo(() => {
    const result: ActionItem[] = [];
    const now = new Date();

    // Overdue POs
    (allPOs || []).forEach((po) => {
      if (po.status === "sent" && !po.confirmedAt && po.requestedDeliveryDate) {
        if (new Date(po.requestedDeliveryDate) < now) {
          result.push({
            id: `po-${po.id}`,
            label: "Overdue",
            ref: po.poNumber,
            supplier: po.supplierName,
            detail: `${formatK(po.total)} kr`,
            urgency: "critical",
            href: `/pos/${po.id}`,
            action: "Contact",
          });
        }
      }

      // Delays
      if (po.confirmedDeliveryDate && po.requestedDeliveryDate &&
          !["received", "completed"].includes(po.status)) {
        const days = Math.ceil(
          (new Date(po.confirmedDeliveryDate).getTime() - new Date(po.requestedDeliveryDate).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        if (days > 0) {
          result.push({
            id: `delay-${po.id}`,
            label: "Delay",
            ref: po.poNumber,
            supplier: po.supplierName,
            detail: `${days}d`,
            urgency: days > 3 ? "critical" : "high",
            href: `/pos/${po.id}`,
            action: "Review",
          });
        }
      }
    });

    // Invoice issues
    (allInvoices || []).forEach((inv) => {
      const isPM = inv.matchResult === "price_mismatch";
      const isQM = inv.matchResult === "quantity_mismatch";
      if (inv.status === "discrepancy" || isPM || isQM) {
        result.push({
          id: `inv-${inv.id}`,
          label: isPM ? "Price" : isQM ? "Qty" : "Match",
          ref: inv.invoiceNumber,
          supplier: inv.supplierName,
          detail: inv.discrepancyAmount
            ? `${inv.discrepancyAmount > 0 ? "+" : ""}${formatK(Math.abs(inv.discrepancyAmount))}`
            : "",
          urgency: Math.abs(inv.discrepancyAmount || 0) > 10000 ? "critical" : "high",
          href: `/invoices/${inv.id}`,
          action: isPM ? "Accept" : "Review",
        });
      }
    });

    const order: Record<Urgency, number> = { critical: 0, high: 1, medium: 2 };
    return result.sort((a, b) => order[a.urgency] - order[b.urgency]);
  }, [allPOs, allInvoices]);

  // Highest urgency level
  const highestUrgency: Urgency | "none" = items.length === 0
    ? "none"
    : items[0].urgency;

  const hasCritical = highestUrgency === "critical";
  const hasItems = items.length > 0;

  // All clear state - minimal
  if (!hasItems) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-sm text-gray-500">No exceptions</span>
      </div>
    );
  }

  // Container styling based on urgency
  const containerStyle = hasCritical
    ? "bg-stark-orange/5 border-stark-orange/30 border-l-4 border-l-stark-orange"
    : "bg-white border-gray-200 border-l-4 border-l-stark-orange/60";

  return (
    <div className={`rounded-lg border overflow-hidden ${containerStyle}`}>
      {/* Header - clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/50 transition-colors"
      >
        {/* Urgency indicator */}
        <UrgencyIndicator urgency={highestUrgency} />

        {/* Count badge */}
        <span className={`
          text-sm font-semibold px-2 py-0.5 rounded
          ${hasCritical
            ? "bg-stark-orange text-white"
            : "bg-stark-orange/20 text-stark-navy"
          }
        `}>
          {items.length}
        </span>

        {/* Label */}
        <span className="text-sm font-medium text-stark-navy">
          Handle Now
        </span>

        {/* Spacer + chevron */}
        <ChevronDown
          size={16}
          className={`ml-auto text-stark-navy/60 transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expanded list */}
      {isExpanded && (
        <div className="bg-white border-t border-gray-100">
          {items.map((item, idx) => (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors
                ${idx > 0 ? "border-t border-gray-50" : ""}
              `}
            >
              {/* Critical indicator */}
              {item.urgency === "critical" && (
                <span className="w-1.5 h-1.5 rounded-full bg-stark-orange flex-shrink-0" />
              )}

              {/* Type */}
              <span className="text-[10px] uppercase text-gray-400 w-12 flex-shrink-0">
                {item.label}
              </span>

              {/* Ref */}
              <span className="font-medium text-stark-navy flex-shrink-0">
                {item.ref}
              </span>

              {/* Supplier */}
              <span className="text-gray-500 truncate flex-1 min-w-0">
                {item.supplier}
              </span>

              {/* Detail */}
              {item.detail && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {item.detail}
                </span>
              )}

              {/* Action */}
              <Button
                size="sm"
                variant={item.urgency === "critical" ? "action" : "outline"}
                className="text-xs px-2 py-0.5 h-auto flex-shrink-0"
              >
                {item.action}
              </Button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Elegant urgency indicator
 */
function UrgencyIndicator({ urgency }: { urgency: Urgency | "none" }) {
  if (urgency === "critical") {
    // Pulsing orange - demands attention
    return (
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute h-full w-full rounded-full bg-stark-orange opacity-75" />
        <span className="relative rounded-full h-3 w-3 bg-stark-orange" />
      </span>
    );
  }

  if (urgency === "high") {
    // Solid orange dot
    return <span className="w-2.5 h-2.5 rounded-full bg-stark-orange" />;
  }

  if (urgency === "medium") {
    // Subtle
    return <span className="w-2 h-2 rounded-full bg-stark-navy/30" />;
  }

  // None - green
  return <span className="w-2 h-2 rounded-full bg-green-500" />;
}
