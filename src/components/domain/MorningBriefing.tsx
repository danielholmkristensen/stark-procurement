/**
 * Morning Briefing Component
 *
 * Compact, scannable status in 3 seconds.
 *
 * Escalation Hierarchy:
 * - Ambient (calm): No border, navy text
 * - Attention (needs eyes): Orange left border
 * - Urgent (time-sensitive): Pulsing orange dot
 * - Success (all clear): Green dot
 *
 * Design: Compact numbers, minimal text, elegant accents.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePurchaseOrders, useInvoices, useSuppliers } from "@/hooks";

export function MorningBriefing() {
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();
  const allSuppliers = useSuppliers();

  const metrics = useMemo(() => {
    const now = new Date();

    // === CUT-OFF COUNTDOWN ===
    const posNeedingSend = (allPOs || []).filter(
      (po) => po.status === "draft" || po.status === "approved"
    );

    let cutoffPOCount = 0;
    let nextCutoffMinutes = Infinity;
    let isUrgent = false;

    posNeedingSend.forEach((po) => {
      if (!po.requestedDeliveryDate) return;

      const supplier = (allSuppliers || []).find((s) => s.id === po.supplierId);
      const leadDays = supplier?.averageLeadTimeDays || 3;

      const deliveryDate = new Date(po.requestedDeliveryDate);
      const mustSendBy = new Date(deliveryDate);
      mustSendBy.setDate(mustSendBy.getDate() - leadDays);

      const hoursUntilCutoff = (mustSendBy.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCutoff <= 24 && hoursUntilCutoff > -24) {
        cutoffPOCount++;
        const minutesUntil = Math.max(0, hoursUntilCutoff * 60);
        if (minutesUntil < nextCutoffMinutes && minutesUntil > 0) {
          nextCutoffMinutes = minutesUntil;
        }
        // Urgent if < 2 hours
        if (minutesUntil < 120) isUrgent = true;
      }
    });

    // === DECISIONS NEEDED ===
    const posAwaitingConfirmation = (allPOs || []).filter(
      (po) => po.status === "sent" && !po.confirmedAt
    ).length;

    const invoiceDiscrepancies = (allInvoices || []).filter(
      (inv) => inv.status === "discrepancy" ||
               inv.matchResult === "price_mismatch" ||
               inv.matchResult === "quantity_mismatch"
    ).length;

    const decisionsNeeded = posAwaitingConfirmation + invoiceDiscrepancies;

    // === DELIVERY RISK ===
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const atRiskPOs = (allPOs || []).filter((po) => {
      if (["received", "completed", "cancelled"].includes(po.status)) return false;
      if (!po.requestedDeliveryDate) return false;
      const deliveryDate = new Date(po.requestedDeliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate <= tomorrow;
    });

    const riskValue = atRiskPOs.reduce((sum, po) => sum + po.total, 0);

    return {
      cutoff: {
        count: cutoffPOCount,
        nextMinutes: nextCutoffMinutes,
        isUrgent,
      },
      decisions: {
        count: decisionsNeeded,
      },
      risk: {
        count: atRiskPOs.length,
        value: riskValue,
      },
    };
  }, [allPOs, allInvoices, allSuppliers]);

  const formatTime = (minutes: number) => {
    if (minutes === Infinity) return "";
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${Math.round(value / 1000)}K`;
    return value.toString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      {/* Compact inline layout */}
      <div className="flex items-stretch divide-x divide-gray-100">
        {/* Cut-off */}
        <BriefingCell
          href="/pos?status=draft"
          label="Cut-off"
          count={metrics.cutoff.count}
          detail={metrics.cutoff.count > 0 ? formatTime(metrics.cutoff.nextMinutes) : undefined}
          level={
            metrics.cutoff.count === 0 ? "success" :
            metrics.cutoff.isUrgent ? "urgent" : "attention"
          }
        />

        {/* Decisions */}
        <BriefingCell
          href="/invoices?status=discrepancy"
          label="Decisions"
          count={metrics.decisions.count}
          level={metrics.decisions.count === 0 ? "success" : "attention"}
        />

        {/* Delivery Risk */}
        <BriefingCell
          href="/pos?view=delivery-risk"
          label="At Risk"
          count={metrics.risk.count}
          detail={metrics.risk.count > 0 ? `${formatValue(metrics.risk.value)} kr` : undefined}
          level={metrics.risk.count === 0 ? "success" : "attention"}
        />
      </div>
    </div>
  );
}

type EscalationLevel = "ambient" | "attention" | "urgent" | "success";

interface BriefingCellProps {
  href: string;
  label: string;
  count: number;
  detail?: string;
  level: EscalationLevel;
}

function BriefingCell({ href, label, count, detail, level }: BriefingCellProps) {
  // Escalation hierarchy styling
  const borderStyle = {
    ambient: "",
    attention: "border-l-2 border-l-stark-orange",
    urgent: "border-l-2 border-l-stark-orange",
    success: "",
  }[level];

  return (
    <Link
      href={href}
      className={`flex-1 px-4 py-3 hover:bg-gray-50 transition-colors ${borderStyle}`}
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="flex-shrink-0">
          {level === "success" && (
            <span className="w-2 h-2 rounded-full bg-green-500 block" />
          )}
          {level === "urgent" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-stark-orange opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-stark-orange" />
            </span>
          )}
          {level === "attention" && (
            <span className="w-2 h-2 rounded-full bg-stark-navy/30 block" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-stark-navy tabular-nums">
              {count}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {label}
            </span>
          </div>
          {detail && (
            <span className="text-xs text-gray-400">{detail}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
