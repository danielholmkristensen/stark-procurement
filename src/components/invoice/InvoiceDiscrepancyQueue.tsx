"use client";

import { useState } from "react";
import Link from "next/link";
import { useDiscrepancyInvoices, usePurchaseOrders } from "@/hooks";
import { Button, StatusBadge, SearchInput } from "@/components/ui";
import type { MatchResult } from "@/lib/db";

export function InvoiceDiscrepancyQueue() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<MatchResult | "all">("all");

  const discrepancyInvoices = useDiscrepancyInvoices();
  const allPOs = usePurchaseOrders();

  const poMap = new Map(allPOs?.map((po) => [po.id, po]) ?? []);

  const filteredInvoices = (discrepancyInvoices ?? []).filter((invoice) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.supplierName.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (selectedType !== "all" && invoice.matchResult !== selectedType) return false;

    return true;
  });

  // Sort by escalation level (urgent first)
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const levelOrder = { urgent: 0, action: 1, attention: 2, awareness: 3, ambient: 4 };
    return (levelOrder[a.escalationLevel] ?? 4) - (levelOrder[b.escalationLevel] ?? 4);
  });

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
    }).format(amount);
  };

  const getDiscrepancyTypeLabel = (result?: MatchResult) => {
    if (!result) return "Unknown";
    const map: Record<MatchResult, string> = {
      full_match: "Full Match",
      quantity_mismatch: "Quantity Mismatch",
      price_mismatch: "Price Mismatch",
      missing_po: "Missing PO",
      partial_match: "Partial Match",
    };
    return map[result] ?? result;
  };

  const getDiscrepancyTypeColor = (result?: MatchResult) => {
    if (!result) return "bg-gray-100 text-gray-700";
    const map: Record<MatchResult, string> = {
      full_match: "bg-green-100 text-green-700",
      quantity_mismatch: "bg-yellow-100 text-yellow-700",
      price_mismatch: "bg-red-100 text-red-700",
      missing_po: "bg-red-100 text-red-700",
      partial_match: "bg-orange-100 text-orange-700",
    };
    return map[result] ?? "bg-gray-100 text-gray-700";
  };

  const getEscalationBorder = (level: string) => {
    const map: Record<string, string> = {
      ambient: "",
      awareness: "border-l-4 border-l-blue-400",
      attention: "border-l-4 border-l-yellow-400",
      action: "border-l-4 border-l-orange-400",
      urgent: "border-l-4 border-l-red-500",
    };
    return map[level] ?? "";
  };

  const discrepancyTypes: MatchResult[] = [
    "quantity_mismatch",
    "price_mismatch",
    "missing_po",
    "partial_match",
  ];

  // Count by type
  const countByType = discrepancyTypes.reduce((acc, type) => {
    acc[type] = discrepancyInvoices?.filter((i) => i.matchResult === type).length ?? 0;
    return acc;
  }, {} as Record<MatchResult, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {discrepancyTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(selectedType === type ? "all" : type)}
            className={`p-4 rounded-lg border text-left transition-all ${
              selectedType === type
                ? "border-stark-navy ring-2 ring-stark-navy/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${getDiscrepancyTypeColor(type)}`}>
              {getDiscrepancyTypeLabel(type)}
            </div>
            <div className="text-2xl font-bold text-stark-navy">{countByType[type]}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discrepancies..."
            />
          </div>
          {selectedType !== "all" && (
            <Button variant="outline" size="sm" onClick={() => setSelectedType("all")}>
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Discrepancy List */}
      <div className="space-y-4">
        {sortedInvoices.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            {search || selectedType !== "all" ? "No discrepancies match your filters" : "No discrepancies to review"}
          </div>
        ) : (
          sortedInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`bg-white rounded-lg border border-gray-200 p-4 ${getEscalationBorder(invoice.escalationLevel)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-lg font-semibold text-stark-navy hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDiscrepancyTypeColor(invoice.matchResult)}`}>
                      {getDiscrepancyTypeLabel(invoice.matchResult)}
                    </span>
                    {invoice.escalationLevel === "urgent" && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        URGENT
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Supplier:</span>{" "}
                      <span className="font-medium">{invoice.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Invoice Date:</span>{" "}
                      <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date:</span>{" "}
                      <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>{" "}
                      <span className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
                    </div>
                  </div>

                  {/* Discrepancy Details */}
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      {invoice.discrepancyAmount && (
                        <div>
                          <span className="text-sm text-gray-500">Discrepancy Amount:</span>{" "}
                          <span className="font-bold text-red-600">
                            {formatCurrency(invoice.discrepancyAmount, invoice.currency)}
                          </span>
                        </div>
                      )}
                      {invoice.poIds.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-500">Linked POs:</span>{" "}
                          {invoice.poIds.map((poId, idx) => {
                            const po = poMap.get(poId);
                            return (
                              <span key={poId}>
                                {idx > 0 && ", "}
                                <Link
                                  href={`/pos/${poId}`}
                                  className="text-stark-navy hover:underline"
                                >
                                  {po?.poNumber ?? poId.slice(0, 8)}
                                </Link>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {invoice.discrepancyNotes && (
                      <p className="mt-2 text-sm text-gray-600">{invoice.discrepancyNotes}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button size="sm">Review</Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    Approve Variance
                  </Button>
                  <Button variant="ghost" size="sm">
                    Request Credit
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {sortedInvoices.length > 0 && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{sortedInvoices.length}</span> discrepancies to review
            </div>
            <div className="text-sm text-gray-600">
              Total discrepancy amount:{" "}
              <span className="font-bold text-red-600">
                {formatCurrency(
                  sortedInvoices.reduce((sum, inv) => sum + (inv.discrepancyAmount ?? 0), 0),
                  "DKK"
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
