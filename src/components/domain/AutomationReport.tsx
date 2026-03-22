/**
 * Automation Report Component
 *
 * Shows what the system handled automatically overnight.
 * Elegant, navy-based with subtle success indicators.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bot, ChevronRight } from "lucide-react";
import { usePurchaseRequests, usePurchaseOrders, useInvoices } from "@/hooks";
import { Card, CardHeader, CardTitle } from "@/components/ui";

export function AutomationReport() {
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const stats = useMemo(() => {
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
    const manualReviewInvoices = (allInvoices || []).filter(
      (inv) => inv.status === "discrepancy" ||
               inv.matchResult === "quantity_mismatch" ||
               inv.matchResult === "price_mismatch"
    ).length;

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
      manualReviewInvoices,
      automationRate,
    };
  }, [allPRs, allPOs, allInvoices]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M kr`;
    if (value >= 1000) return `${Math.round(value / 1000)}K kr`;
    return `${value} kr`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-gray-400" />
          <CardTitle>Overnight</CardTitle>
        </div>
      </CardHeader>
      <div className="px-4 pb-4 space-y-2">
        {/* Compact stats */}
        <div className="space-y-1.5 text-sm">
          <AutoLine
            count={stats.relexProcessed}
            label="PRs processed"
            success
          />
          <AutoLine
            count={stats.autoSentPOs}
            label="POs sent"
            detail={formatCurrency(stats.autoSentValue)}
            success
          />
          <AutoLine
            count={stats.autoMatchedInvoices}
            label="invoices matched"
            success
          />
          {stats.manualReviewInvoices > 0 && (
            <AutoLine
              count={stats.manualReviewInvoices}
              label="need review"
            />
          )}
        </div>

        {/* Automation rate - subtle */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Automation:</span>
            <span className="flex items-center gap-1">
              {stats.automationRate >= 90 && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              )}
              <span className="font-medium text-stark-navy">{stats.automationRate}%</span>
            </span>
          </div>
          <Link
            href="/activity"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-stark-navy"
          >
            Log
            <ChevronRight size={10} />
          </Link>
        </div>
      </div>
    </Card>
  );
}

interface AutoLineProps {
  count: number;
  label: string;
  detail?: string;
  success?: boolean;
}

function AutoLine({ count, label, detail, success }: AutoLineProps) {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      {success && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
      )}
      <span className="font-medium text-stark-navy">{count}</span>
      <span>{label}</span>
      {detail && <span className="text-gray-400 text-xs ml-auto">{detail}</span>}
    </div>
  );
}
