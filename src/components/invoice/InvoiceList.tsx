"use client";

/**
 * Invoice List
 *
 * Grouped by match confidence with financial impact guidance.
 * Pattern detection for recurring supplier issues.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { List, Layers, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { useInvoices, useSuppliers } from "@/hooks";
import {
  Button,
  SearchInput,
  Select,
  StatusBadge,
  EscalationIndicator,
  CollapsibleSection,
  GuidanceBanner,
  SectionSummary,
} from "@/components/ui";
import type { InvoiceStatus, MatchResult, Invoice, EscalationLevel } from "@/lib/db";

type ViewMode = "flat" | "grouped";
type MatchConfidence = "investigation" | "quick_review" | "auto_approve" | "missing_po";

const CONFIDENCE_ORDER: MatchConfidence[] = ["investigation", "quick_review", "auto_approve", "missing_po"];

const confidenceLabels: Record<MatchConfidence, string> = {
  investigation: "INVESTIGATION NEEDED",
  quick_review: "QUICK REVIEW",
  auto_approve: "AUTO-APPROVE CANDIDATES",
  missing_po: "MISSING PO REFERENCE",
};

const confidenceDescriptions: Record<MatchConfidence, string> = {
  investigation: "Variance > 5% — Needs attention",
  quick_review: "Minor variance < 2%",
  auto_approve: "Full match — Ready to approve",
  missing_po: "Cannot match automatically",
};

export function InvoiceList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");

  const allInvoices = useInvoices();
  const allSuppliers = useSuppliers();

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    return (allInvoices ?? []).filter((invoice) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
          invoice.supplierName.toLowerCase().includes(searchLower) ||
          invoice.supplierInvoiceRef.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (statusFilter !== "all" && invoice.status !== statusFilter) return false;
      return true;
    });
  }, [allInvoices, search, statusFilter]);

  // Calculate match confidence for an invoice
  const getMatchConfidence = (invoice: Invoice): MatchConfidence => {
    if (invoice.matchResult === "missing_po") return "missing_po";
    if (invoice.matchResult === "full_match") return "auto_approve";

    // Calculate variance percentage
    const variancePercent = invoice.discrepancyAmount
      ? Math.abs(invoice.discrepancyAmount / invoice.total) * 100
      : 0;

    if (variancePercent > 5) return "investigation";
    if (variancePercent > 0) return "quick_review";
    return "auto_approve";
  };

  // Group by match confidence
  const groupedInvoices = useMemo(() => {
    const groups: Record<MatchConfidence, Invoice[]> = {
      investigation: [],
      quick_review: [],
      auto_approve: [],
      missing_po: [],
    };

    filteredInvoices.forEach((invoice) => {
      const confidence = getMatchConfidence(invoice);
      groups[confidence].push(invoice);
    });

    // Sort each group by date
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    });

    return groups;
  }, [filteredInvoices]);

  // Calculate guidance data
  const guidanceData = useMemo(() => {
    const discrepancies = filteredInvoices.filter(
      (inv) => inv.status === "discrepancy" ||
        inv.matchResult === "quantity_mismatch" ||
        inv.matchResult === "price_mismatch"
    );

    const totalDiscrepancyAmount = discrepancies.reduce(
      (sum, inv) => sum + Math.abs(inv.discrepancyAmount || 0),
      0
    );

    const qtyMismatches = discrepancies.filter(inv => inv.matchResult === "quantity_mismatch").length;
    const priceMismatches = discrepancies.filter(inv => inv.matchResult === "price_mismatch").length;

    // Pattern detection - group discrepancies by supplier
    const supplierDiscrepancies: Record<string, { count: number; name: string; type: string }> = {};
    discrepancies.forEach((inv) => {
      if (!supplierDiscrepancies[inv.supplierId]) {
        supplierDiscrepancies[inv.supplierId] = { count: 0, name: inv.supplierName, type: "" };
      }
      supplierDiscrepancies[inv.supplierId].count++;
      supplierDiscrepancies[inv.supplierId].type = inv.matchResult || "";
    });

    const patterns = Object.values(supplierDiscrepancies)
      .filter(s => s.count >= 2)
      .sort((a, b) => b.count - a.count);

    // Aging - invoices older than 5 days
    const now = new Date();
    const agingInvoices = filteredInvoices.filter((inv) => {
      if (inv.status === "approved" || inv.status === "paid") return false;
      const daysSinceReceived = Math.floor(
        (now.getTime() - new Date(inv.receivedDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceReceived > 5;
    });

    return {
      discrepancyCount: discrepancies.length,
      totalDiscrepancyAmount,
      qtyMismatches,
      priceMismatches,
      patterns,
      agingCount: agingInvoices.length,
    };
  }, [filteredInvoices]);

  const formatCurrency = (amount: number, currency: string = "DKK") => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) return `DKK ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `DKK ${Math.round(value / 1000)}K`;
    return formatCurrency(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const getStatusVariant = (status: InvoiceStatus): "default" | "success" | "warning" => {
    switch (status) {
      case "discrepancy": return "warning";
      case "approved":
      case "paid":
      case "matched": return "success";
      default: return "default";
    }
  };

  const getMatchLabel = (result?: MatchResult) => {
    if (!result) return null;
    const labels: Record<MatchResult, string> = {
      full_match: "Full Match",
      quantity_mismatch: "Qty Mismatch",
      price_mismatch: "Price Mismatch",
      missing_po: "Missing PO",
      partial_match: "Partial",
    };
    return labels[result];
  };

  const getConfidenceEscalation = (confidence: MatchConfidence): EscalationLevel | undefined => {
    switch (confidence) {
      case "investigation": return "action";
      case "missing_po": return "attention";
      default: return undefined;
    }
  };

  // Stats
  const stats = [
    { label: "Total", value: allInvoices?.length ?? 0 },
    { label: "Discrepancy", value: guidanceData.discrepancyCount, variant: "action" as const },
    { label: "Pending", value: allInvoices?.filter((i) => i.status === "pending_match").length ?? 0 },
    { label: "Approved", value: allInvoices?.filter((i) => i.status === "approved" || i.status === "paid").length ?? 0, variant: "success" as const },
  ];

  return (
    <div className="space-y-4">
      {/* Financial Impact Banner */}
      {viewMode === "grouped" && guidanceData.discrepancyCount > 0 && (
        <GuidanceBanner
          variant="action"
          icon={<AlertTriangle size={20} />}
          title={`${formatCurrencyShort(guidanceData.totalDiscrepancyAmount)} in discrepancies across ${guidanceData.discrepancyCount} invoice${guidanceData.discrepancyCount !== 1 ? "s" : ""}`}
          description={
            guidanceData.qtyMismatches > 0 || guidanceData.priceMismatches > 0
              ? `${guidanceData.qtyMismatches} quantity mismatch${guidanceData.qtyMismatches !== 1 ? "es" : ""} • ${guidanceData.priceMismatches} price variance${guidanceData.priceMismatches !== 1 ? "s" : ""}`
              : undefined
          }
          action={{ label: "Resolve Now", href: "/invoices/discrepancies" }}
        />
      )}

      {/* Pattern Detection Banner */}
      {viewMode === "grouped" && guidanceData.patterns.length > 0 && (
        <GuidanceBanner
          variant="warning"
          icon={<TrendingUp size={20} />}
          title="Pattern Detected"
          description={`${guidanceData.patterns[0].name}: ${guidanceData.patterns[0].count} discrepancies this month — Consider reviewing contract pricing or escalating to supplier`}
        />
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Filters & View Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-3">
            <div className="flex gap-4 items-center flex-1">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices..."
              />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | "all")}>
                <option value="all">All Statuses</option>
                <option value="discrepancy">Discrepancy</option>
                <option value="pending_match">Pending Match</option>
                <option value="matched">Matched</option>
                <option value="approved">Approved</option>
              </Select>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "grouped" ? "primary" : "outline"}
                size="sm"
                onClick={() => setViewMode("grouped")}
                title="Grouped view"
              >
                <Layers size={16} />
              </Button>
              <Button
                variant={viewMode === "flat" ? "primary" : "outline"}
                size="sm"
                onClick={() => setViewMode("flat")}
                title="Flat view"
              >
                <List size={16} />
              </Button>
              <Link href="/invoices/discrepancies">
                <Button variant="outline" size="sm">Discrepancy Queue</Button>
              </Link>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="flex flex-wrap gap-2 text-xs">
            {stats.map((stat) => (
              <span
                key={stat.label}
                className={`px-2 py-1 rounded font-medium ${
                  stat.variant === "action"
                    ? "bg-stark-orange-10 text-stark-orange"
                    : stat.variant === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {stat.value} {stat.label}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        {viewMode === "grouped" ? (
          <div className="p-4 space-y-4">
            {CONFIDENCE_ORDER.map((confidence) => {
              const invoices = groupedInvoices[confidence];
              if (invoices.length === 0) return null;

              const totalValue = invoices.reduce((sum, inv) => sum + inv.total, 0);
              const discrepancyValue = invoices.reduce((sum, inv) => sum + Math.abs(inv.discrepancyAmount || 0), 0);

              return (
                <CollapsibleSection
                  key={confidence}
                  title={
                    <span className="flex items-center gap-2">
                      {confidenceLabels[confidence]}
                      {confidence === "auto_approve" && (
                        <CheckCircle size={14} className="text-green-600" />
                      )}
                    </span>
                  }
                  count={invoices.length}
                  defaultExpanded={confidence === "investigation" || confidence === "missing_po"}
                  escalationLevel={getConfidenceEscalation(confidence)}
                >
                  <SectionSummary
                    totalValue={totalValue}
                    itemCount={invoices.length}
                    urgentCount={confidence === "investigation" ? invoices.length : undefined}
                  />
                  <div className="text-xs text-gray-500 px-3 py-1 bg-gray-50 border-b border-gray-100">
                    {confidenceDescriptions[confidence]}
                    {discrepancyValue > 0 && confidence !== "auto_approve" && (
                      <span className="ml-2 text-stark-orange font-medium">
                        {formatCurrencyShort(discrepancyValue)} variance
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {invoices.map((invoice) => (
                      <InvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getStatusVariant={getStatusVariant}
                        getMatchLabel={getMatchLabel}
                      />
                    ))}
                  </div>
                </CollapsibleSection>
              );
            })}

            {filteredInvoices.length === 0 && (
              <div className="py-8 text-center text-gray-400">
                No invoices found
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredInvoices.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                No invoices found
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusVariant={getStatusVariant}
                  getMatchLabel={getMatchLabel}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface InvoiceRowProps {
  invoice: Invoice;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date) => string;
  getStatusVariant: (status: InvoiceStatus) => "default" | "success" | "warning";
  getMatchLabel: (result?: MatchResult) => string | null;
}

function InvoiceRow({
  invoice,
  formatCurrency,
  formatDate,
  getStatusVariant,
  getMatchLabel,
}: InvoiceRowProps) {
  const needsAction = invoice.status === "discrepancy" || invoice.matchResult !== "full_match";

  // Calculate days since received
  const daysSinceReceived = Math.floor(
    (Date.now() - new Date(invoice.receivedDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isAging = daysSinceReceived > 5 && invoice.status !== "approved" && invoice.status !== "paid";

  return (
    <Link
      href={`/invoices/${invoice.id}`}
      className={`flex items-center justify-between p-3 hover:bg-gray-50 group ${
        needsAction ? "border-l-2 border-l-stark-orange" : ""
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <EscalationIndicator level={invoice.escalationLevel} />
        <div className="min-w-0">
          <div className="font-medium text-gray-900 group-hover:underline">
            {invoice.invoiceNumber}
          </div>
          <div className="text-xs text-gray-500 truncate flex items-center gap-2">
            {invoice.supplierName}
            {isAging && (
              <span className="text-amber-600">
                • {daysSinceReceived}d old
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500 w-20">{formatDate(invoice.invoiceDate)}</span>
        <span className="font-medium text-gray-900 w-28 text-right">
          {formatCurrency(invoice.total, invoice.currency)}
        </span>
        {invoice.matchResult && (
          <span className={`px-2 py-0.5 rounded text-xs ${
            invoice.matchResult === "full_match"
              ? "bg-green-100 text-green-800"
              : "bg-stark-orange-10 text-gray-700 border border-stark-orange/30"
          }`}>
            {getMatchLabel(invoice.matchResult)}
          </span>
        )}
        {invoice.discrepancyAmount && invoice.discrepancyAmount !== 0 && (
          <span className="text-xs text-stark-orange font-medium w-20 text-right">
            {invoice.discrepancyAmount > 0 ? "+" : ""}{formatCurrency(invoice.discrepancyAmount, invoice.currency)}
          </span>
        )}
        <span className="text-gray-400 group-hover:text-stark-navy">→</span>
      </div>
    </Link>
  );
}
