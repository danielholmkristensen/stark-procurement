"use client";

/**
 * Invoice List
 *
 * Grouped by status with collapsible sections.
 * Discrepancies highlighted for action.
 * Follows Command Center UX principles.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { useInvoices, useSuppliers } from "@/hooks";
import {
  Button,
  SearchInput,
  Select,
  StatusBadge,
  EscalationIndicator,
  CollapsibleSection,
  CompactStats,
  WarningIcon,
} from "@/components/ui";
import type { InvoiceStatus, MatchResult, Invoice } from "@/lib/db";

const statusOrder: InvoiceStatus[] = [
  "discrepancy",
  "pending_match",
  "received",
  "matched",
  "approved",
  "paid",
  "rejected",
];

const statusLabels: Record<InvoiceStatus, string> = {
  received: "Received",
  pending_match: "Pending Match",
  matched: "Matched",
  discrepancy: "Discrepancy",
  approved: "Approved",
  paid: "Paid",
  rejected: "Rejected",
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "discrepancy", label: "Discrepancy" },
  { value: "pending_match", label: "Pending Match" },
  { value: "received", label: "Received" },
  { value: "matched", label: "Matched" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
];

export function InvoiceList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["discrepancy", "pending_match"])
  );

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

  // Group by status
  const groupedInvoices = useMemo(() => {
    const groups: Record<InvoiceStatus, Invoice[]> = {
      received: [],
      pending_match: [],
      matched: [],
      discrepancy: [],
      approved: [],
      paid: [],
      rejected: [],
    };
    filteredInvoices.forEach((invoice) => {
      groups[invoice.status].push(invoice);
    });
    // Sort each group by date
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    });
    return groups;
  }, [filteredInvoices]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusVariant = (status: InvoiceStatus): "default" | "success" | "warning" => {
    switch (status) {
      case "discrepancy":
        return "warning";
      case "pending_match":
        return "default";
      case "approved":
      case "paid":
      case "matched":
        return "success";
      default:
        return "default";
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

  const isActionRequired = (status: InvoiceStatus) =>
    status === "discrepancy" || status === "pending_match";

  // Stats
  const stats = [
    {
      label: "Total",
      value: allInvoices?.length ?? 0,
      filter: "all",
    },
    {
      label: "Discrepancy",
      value: allInvoices?.filter((i) => i.status === "discrepancy").length ?? 0,
      filter: "discrepancy",
      variant: "action" as const,
    },
    {
      label: "Pending",
      value: allInvoices?.filter((i) => i.status === "pending_match").length ?? 0,
      filter: "pending_match",
      variant: "warning" as const,
    },
    {
      label: "Approved",
      value: allInvoices?.filter((i) => i.status === "approved" || i.status === "paid").length ?? 0,
      filter: "approved",
      variant: "success" as const,
    },
  ];

  const toggleSection = (status: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Compact Stats + Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <CompactStats
            stats={stats}
            activeFilter={statusFilter}
            onFilterChange={(f) => setStatusFilter(f as typeof statusFilter)}
          />
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
            />
          </div>
          <Link href="/invoices/discrepancies">
            <Button variant="outline" size="sm">
              Discrepancy Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Grouped Invoice List */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            {search || statusFilter !== "all"
              ? "No invoices match your filters"
              : "No invoices found"}
          </div>
        ) : (
          statusOrder.map((status) => {
            const invoices = groupedInvoices[status];
            if (invoices.length === 0) return null;

            const isExpanded = expandedSections.has(status);
            const needsAction = isActionRequired(status);

            return (
              <div
                key={status}
                className={`rounded-lg border overflow-hidden ${
                  needsAction ? "border-stark-orange/30 bg-stark-orange-10/20" : "border-gray-200"
                }`}
              >
                <button
                  onClick={() => toggleSection(status)}
                  className={`w-full flex items-center justify-between p-3 transition-colors ${
                    needsAction ? "bg-stark-orange-10/30 hover:bg-stark-orange-10/50" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{isExpanded ? "▼" : "▶"}</span>
                    <span className="font-medium text-sm text-gray-900">{statusLabels[status]}</span>
                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                      needsAction ? "bg-stark-orange/20 text-stark-orange" : "bg-gray-200 text-gray-700"
                    }`}>
                      {invoices.length}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {invoices.map((invoice) => (
                      <Link
                        key={invoice.id}
                        href={`/invoices/${invoice.id}`}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 group"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <EscalationIndicator level={invoice.escalationLevel} />
                          <div className="min-w-0">
                            <div className="font-medium text-stark-navy group-hover:underline">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {invoice.supplierName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500 w-20">{formatDate(invoice.invoiceDate)}</span>
                          <span className="font-medium text-stark-navy w-28 text-right">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </span>
                          {invoice.matchResult && (
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              invoice.matchResult === "full_match"
                                ? "bg-green-100 text-green-800"
                                : "bg-stark-orange-10 text-stark-navy border border-stark-orange/30"
                            }`}>
                              {getMatchLabel(invoice.matchResult)}
                            </span>
                          )}
                          <span className="text-stark-navy group-hover:text-stark-orange">→</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
