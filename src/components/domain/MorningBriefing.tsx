/**
 * Morning Briefing Component
 *
 * Answers 3 action-enabling questions in 10 seconds:
 * 1. Cut-off Countdown - Time-bound urgency for PO sending
 * 2. Requires Your Decision - Supplier responses needing judgment
 * 3. Delivery Risk Today - Leading indicator of problems
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Clock, MessageSquareWarning, Truck, ChevronRight } from "lucide-react";
import { usePurchaseOrders, useInvoices, useSuppliers } from "@/hooks";

export function MorningBriefing() {
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();
  const allSuppliers = useSuppliers();

  const metrics = useMemo(() => {
    const now = new Date();

    // === CUT-OFF COUNTDOWN ===
    // POs in draft/approved that need to be sent
    // Use supplier lead time to calculate urgency
    const posNeedingSend = (allPOs || []).filter(
      (po) => po.status === "draft" || po.status === "approved"
    );

    // Group by supplier for cut-off calculation
    const supplierCutoffs: Record<string, { count: number; name: string }> = {};
    let cutoffPOCount = 0;
    let nextCutoffMinutes = Infinity;

    posNeedingSend.forEach((po) => {
      if (!po.requestedDeliveryDate) return;

      const supplier = (allSuppliers || []).find((s) => s.id === po.supplierId);
      const leadDays = supplier?.averageLeadTimeDays || 3;

      // Calculate when PO must be sent (delivery date minus lead time)
      const deliveryDate = new Date(po.requestedDeliveryDate);
      const mustSendBy = new Date(deliveryDate);
      mustSendBy.setDate(mustSendBy.getDate() - leadDays);

      // If must send today or has passed, count as needing action
      const hoursUntilCutoff = (mustSendBy.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCutoff <= 24 && hoursUntilCutoff > -24) {
        cutoffPOCount++;
        const minutesUntil = Math.max(0, hoursUntilCutoff * 60);
        if (minutesUntil < nextCutoffMinutes && minutesUntil > 0) {
          nextCutoffMinutes = minutesUntil;
        }

        if (!supplierCutoffs[po.supplierId]) {
          supplierCutoffs[po.supplierId] = { count: 0, name: po.supplierName };
        }
        supplierCutoffs[po.supplierId].count++;
      }
    });

    const supplierCount = Object.keys(supplierCutoffs).length;

    // Format next cutoff time
    let nextCutoffLabel = "";
    if (nextCutoffMinutes < Infinity) {
      if (nextCutoffMinutes < 60) {
        nextCutoffLabel = `${Math.round(nextCutoffMinutes)} min`;
      } else {
        const hours = Math.floor(nextCutoffMinutes / 60);
        const mins = Math.round(nextCutoffMinutes % 60);
        nextCutoffLabel = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      }
    }

    // === REQUIRES YOUR DECISION ===
    // POs sent but awaiting confirmation review
    // Invoices with discrepancies
    const posAwaitingConfirmation = (allPOs || []).filter(
      (po) => po.status === "sent" && !po.confirmedAt
    ).length;

    const posWithIssues = (allPOs || []).filter((po) => {
      // Confirmed but delivery date changed
      if (po.confirmedDeliveryDate && po.requestedDeliveryDate) {
        const confirmed = new Date(po.confirmedDeliveryDate);
        const requested = new Date(po.requestedDeliveryDate);
        if (confirmed > requested) return true;
      }
      return false;
    }).length;

    const invoiceDiscrepancies = (allInvoices || []).filter(
      (inv) => inv.status === "discrepancy"
    ).length;

    const invoicePriceChanges = (allInvoices || []).filter(
      (inv) => inv.matchResult === "price_mismatch"
    ).length;

    const invoiceQtyChanges = (allInvoices || []).filter(
      (inv) => inv.matchResult === "quantity_mismatch"
    ).length;

    const decisionsNeeded = posAwaitingConfirmation + posWithIssues + invoiceDiscrepancies;
    const decisionBreakdown = [];
    if (posAwaitingConfirmation > 0) decisionBreakdown.push(`${posAwaitingConfirmation} awaiting confirm`);
    if (invoicePriceChanges > 0) decisionBreakdown.push(`${invoicePriceChanges} price`);
    if (invoiceQtyChanges > 0) decisionBreakdown.push(`${invoiceQtyChanges} qty`);

    // === DELIVERY RISK TODAY ===
    // POs with delivery dates at risk (today or past due, not yet received)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const atRiskPOs = (allPOs || []).filter((po) => {
      if (po.status === "received" || po.status === "completed" || po.status === "cancelled") {
        return false;
      }
      if (!po.requestedDeliveryDate) return false;

      const deliveryDate = new Date(po.requestedDeliveryDate);
      deliveryDate.setHours(0, 0, 0, 0);

      // Due today or overdue
      return deliveryDate <= tomorrow;
    });

    // Count affected stores/branches
    const affectedBranches = new Set(atRiskPOs.map((po) => po.branchId));
    const riskValue = atRiskPOs.reduce((sum, po) => sum + po.total, 0);

    return {
      // Cut-off
      cutoffPOCount,
      supplierCount,
      nextCutoffLabel,

      // Decisions
      decisionsNeeded,
      decisionBreakdown,

      // Delivery Risk
      deliveryRiskCount: atRiskPOs.length,
      affectedBranchCount: affectedBranches.size,
      riskValue,
    };
  }, [allPOs, allInvoices, allSuppliers]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `€${Math.round(value / 1000)}K`;
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-stark-navy uppercase tracking-wide">
          Morning Briefing
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Cut-off Countdown */}
        <BriefingCard
          icon={<Clock size={20} />}
          title="Cut-off Countdown"
          value={
            metrics.cutoffPOCount > 0
              ? `${metrics.cutoffPOCount} PO${metrics.cutoffPOCount !== 1 ? "s" : ""} need action`
              : "All clear"
          }
          subtitle={
            metrics.cutoffPOCount > 0
              ? `${metrics.supplierCount} supplier${metrics.supplierCount !== 1 ? "s" : ""} • Next: ${metrics.nextCutoffLabel || "now"}`
              : "No urgent cut-offs"
          }
          variant={metrics.cutoffPOCount > 0 ? "alert" : "success"}
          href="/pos?status=draft"
        />

        {/* Requires Your Decision */}
        <BriefingCard
          icon={<MessageSquareWarning size={20} />}
          title="Requires Your Decision"
          value={
            metrics.decisionsNeeded > 0
              ? `${metrics.decisionsNeeded} response${metrics.decisionsNeeded !== 1 ? "s" : ""} need review`
              : "No decisions pending"
          }
          subtitle={
            metrics.decisionBreakdown.length > 0
              ? metrics.decisionBreakdown.join(" • ")
              : "All responses processed"
          }
          variant={metrics.decisionsNeeded > 0 ? "alert" : "success"}
          href="/invoices?status=discrepancy"
        />

        {/* Delivery Risk Today */}
        <BriefingCard
          icon={<Truck size={20} />}
          title="Delivery Risk Today"
          value={
            metrics.deliveryRiskCount > 0
              ? `${metrics.deliveryRiskCount} order${metrics.deliveryRiskCount !== 1 ? "s" : ""} at risk`
              : "On track"
          }
          subtitle={
            metrics.deliveryRiskCount > 0
              ? `${metrics.affectedBranchCount} store${metrics.affectedBranchCount !== 1 ? "s" : ""} • ${formatCurrency(metrics.riskValue)}`
              : "All deliveries on schedule"
          }
          variant={metrics.deliveryRiskCount > 0 ? "warning" : "success"}
          href="/pos?view=delivery-risk"
        />
      </div>
    </div>
  );
}

interface BriefingCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  variant: "alert" | "warning" | "success" | "neutral";
  href?: string;
}

function BriefingCard({ icon, title, value, subtitle, variant, href }: BriefingCardProps) {
  const iconColor = {
    alert: "text-stark-orange",
    warning: "text-amber-500",
    success: "text-green-600",
    neutral: "text-stark-navy",
  }[variant];

  const valueColor = {
    alert: "text-stark-orange",
    warning: "text-amber-600",
    success: "text-green-700",
    neutral: "text-stark-navy",
  }[variant];

  const content = (
    <div className={`px-5 py-4 flex items-center gap-4 ${href ? "hover:bg-gray-50 transition-colors cursor-pointer" : ""}`}>
      <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        <p className={`text-lg font-bold ${valueColor} truncate`}>{value}</p>
        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
      </div>
      {href && <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
