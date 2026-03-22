/**
 * Automation Report Component
 *
 * Shows what the system handled automatically overnight.
 * Builds buyer confidence and makes exception queue feel manageable.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { usePurchaseRequests, usePurchaseOrders, useInvoices } from "@/hooks";
import { Card, CardHeader, CardTitle } from "@/components/ui";

export function AutomationReport() {
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const stats = useMemo(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // PRs processed from Relex (automated replenishment)
    const relexPRs = (allPRs || []).filter((pr) => pr.source === "relex");
    const relexProcessed = relexPRs.filter(
      (pr) => pr.status === "converted" || pr.status === "approved"
    ).length;

    // POs sent automatically (via EDI)
    const autoSentPOs = (allPOs || []).filter(
      (po) => po.sentVia === "edi" && po.sentAt
    );
    const autoSentValue = autoSentPOs.reduce((sum, po) => sum + po.total, 0);

    // Invoices auto-matched (full match)
    const autoMatchedInvoices = (allInvoices || []).filter(
      (inv) => inv.matchResult === "full_match"
    ).length;

    // Manual review required
    const manualReviewPRs = (allPRs || []).filter(
      (pr) => pr.source === "relex" && pr.status === "pending"
    ).length;

    const manualReviewInvoices = (allInvoices || []).filter(
      (inv) => inv.status === "discrepancy" || inv.matchResult === "quantity_mismatch" || inv.matchResult === "price_mismatch"
    ).length;

    const manualReviewTotal = manualReviewPRs + manualReviewInvoices;

    // Calculate automation rate
    const totalProcessable = relexPRs.length + (allInvoices?.length || 0);
    const autoProcessed = relexProcessed + autoMatchedInvoices;
    const automationRate = totalProcessable > 0
      ? Math.round((autoProcessed / totalProcessable) * 100)
      : 100;

    return {
      relexProcessed,
      autoSentPOs: autoSentPOs.length,
      autoSentValue,
      autoMatchedInvoices,
      manualReviewTotal,
      automationRate,
    };
  }, [allPRs, allPOs, allInvoices]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `DKK ${Math.round(value / 1000)}K`;
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-stark-navy" />
          <CardTitle>Overnight Automation</CardTitle>
        </div>
      </CardHeader>
      <div className="px-5 py-4 space-y-3">
        {/* Success items */}
        <div className="space-y-2">
          <AutoItem
            icon={<CheckCircle2 size={14} className="text-green-600" />}
            label={`${stats.relexProcessed} PRs from Relex processed`}
          />
          <AutoItem
            icon={<CheckCircle2 size={14} className="text-green-600" />}
            label={`${stats.autoSentPOs} POs sent automatically (${formatCurrency(stats.autoSentValue)})`}
          />
          <AutoItem
            icon={<CheckCircle2 size={14} className="text-green-600" />}
            label={`${stats.autoMatchedInvoices} invoices auto-matched`}
          />
          {stats.manualReviewTotal > 0 && (
            <AutoItem
              icon={<AlertCircle size={14} className="text-amber-500" />}
              label={`${stats.manualReviewTotal} required manual review`}
              variant="warning"
            />
          )}
        </div>

        {/* Automation rate */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Automation rate:</span>
            <span className={`text-sm font-bold ${
              stats.automationRate >= 90 ? "text-green-600" :
              stats.automationRate >= 70 ? "text-amber-600" :
              "text-stark-orange"
            }`}>
              {stats.automationRate}%
            </span>
            {stats.automationRate >= 90 && (
              <span className="text-xs text-green-600">↑</span>
            )}
          </div>
          <Link
            href="/activity"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-stark-navy"
          >
            Full Log
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </Card>
  );
}

interface AutoItemProps {
  icon: React.ReactNode;
  label: string;
  variant?: "success" | "warning";
}

function AutoItem({ icon, label, variant = "success" }: AutoItemProps) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className={`text-sm ${variant === "warning" ? "text-amber-700" : "text-gray-700"}`}>
        {label}
      </span>
    </div>
  );
}
