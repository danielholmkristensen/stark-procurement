"use client";

import { useState } from "react";
import Link from "next/link";
import { useInvoices, useSuppliers } from "@/hooks";
import { Button, SearchInput, Select, StatusBadge } from "@/components/ui";
import type { InvoiceStatus, MatchResult } from "@/lib/db";

interface InvoiceListProps {
  initialStatus?: InvoiceStatus | "all";
  initialMatchResult?: MatchResult | "all";
}

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "received", label: "Received" },
  { value: "pending_match", label: "Pending Match" },
  { value: "matched", label: "Matched" },
  { value: "discrepancy", label: "Discrepancy" },
  { value: "approved", label: "Approved" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
];

const matchResultOptions = [
  { value: "all", label: "All Match Results" },
  { value: "full_match", label: "Full Match" },
  { value: "quantity_mismatch", label: "Quantity Mismatch" },
  { value: "price_mismatch", label: "Price Mismatch" },
  { value: "missing_po", label: "Missing PO" },
  { value: "partial_match", label: "Partial Match" },
];

export function InvoiceList({
  initialStatus = "all",
  initialMatchResult = "all",
}: InvoiceListProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">(initialStatus);
  const [matchResult, setMatchResult] = useState<MatchResult | "all">(initialMatchResult);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const allInvoices = useInvoices();
  const allSuppliers = useSuppliers();

  const supplierMap = new Map(allSuppliers?.map((s) => [s.id, s]) ?? []);

  // Filter invoices
  const filteredInvoices = (allInvoices ?? []).filter((invoice) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.supplierName.toLowerCase().includes(searchLower) ||
        invoice.supplierInvoiceRef.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (status !== "all" && invoice.status !== status) return false;

    // Match result filter
    if (matchResult !== "all" && invoice.matchResult !== matchResult) return false;

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);
  const paginatedInvoices = filteredInvoices.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getStatusVariant = (invoiceStatus: InvoiceStatus) => {
    const map: Record<InvoiceStatus, "success" | "warning" | "error" | "info" | "primary"> = {
      received: "info",
      pending_match: "warning",
      matched: "success",
      discrepancy: "error",
      approved: "success",
      paid: "primary",
      rejected: "error",
    };
    return map[invoiceStatus] ?? "info";
  };

  const getMatchResultVariant = (result?: MatchResult) => {
    if (!result) return "info";
    const map: Record<MatchResult, "success" | "warning" | "error" | "info"> = {
      full_match: "success",
      quantity_mismatch: "warning",
      price_mismatch: "error",
      missing_po: "error",
      partial_match: "warning",
    };
    return map[result] ?? "info";
  };

  const getMatchResultLabel = (result?: MatchResult) => {
    if (!result) return "—";
    const map: Record<MatchResult, string> = {
      full_match: "Full Match",
      quantity_mismatch: "Qty Mismatch",
      price_mismatch: "Price Mismatch",
      missing_po: "Missing PO",
      partial_match: "Partial Match",
    };
    return map[result] ?? result;
  };


  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
            />
          </div>
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as InvoiceStatus | "all");
              setPage(1);
            }}
            className="w-40"
          />
          <Select
            options={matchResultOptions}
            value={matchResult}
            onChange={(e) => {
              setMatchResult(e.target.value as MatchResult | "all");
              setPage(1);
            }}
            className="w-44"
          />
          <Link href="/invoices/discrepancies">
            <Button variant="outline" size="sm">
              Discrepancy Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Invoices</div>
          <div className="text-2xl font-bold text-stark-navy">{allInvoices?.length ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Pending Match</div>
          <div className="text-2xl font-bold text-yellow-600">
            {allInvoices?.filter((i) => i.status === "pending_match").length ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Discrepancies</div>
          <div className="text-2xl font-bold text-red-600">
            {allInvoices?.filter((i) => i.status === "discrepancy").length ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Approved</div>
          <div className="text-2xl font-bold text-green-600">
            {allInvoices?.filter((i) => i.status === "approved").length ?? 0}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Due Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Match
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="hover:bg-gray-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="font-medium text-stark-navy hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                  <div className="text-xs text-gray-500">{invoice.supplierInvoiceRef}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {invoice.supplierName}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(invoice.invoiceDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(invoice.dueDate)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  {formatCurrency(invoice.total, invoice.currency)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={invoice.status.replace(/_/g, " ")}
                    variant={getStatusVariant(invoice.status)}
                  />
                </td>
                <td className="px-4 py-3">
                  {invoice.matchResult ? (
                    <StatusBadge
                      status={getMatchResultLabel(invoice.matchResult)}
                      variant={getMatchResultVariant(invoice.matchResult)}
                    />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/invoices/${invoice.id}`}>
                    <Button variant="ghost" size="sm">
                      View →
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {paginatedInvoices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, filteredInvoices.length)} of{" "}
            {filteredInvoices.length} invoices
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
