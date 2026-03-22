"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useApprovals,
  usePurchaseRequests,
  usePurchaseOrders,
  useInvoices,
} from "@/hooks";
import { Button, StatusBadge, SearchInput, Select } from "@/components/ui";
import type { ApprovalStatus } from "@/lib/db";

export function ApprovalHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "rejected">("all");
  const [entityFilter, setEntityFilter] = useState<"all" | "pr" | "po" | "invoice">("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const allApprovals = useApprovals();
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const prMap = new Map(allPRs?.map((pr) => [pr.id, pr]) ?? []);
  const poMap = new Map(allPOs?.map((po) => [po.id, po]) ?? []);
  const invoiceMap = new Map(allInvoices?.map((inv) => [inv.id, inv]) ?? []);

  // Filter to completed approvals only
  const completedApprovals = (allApprovals ?? []).filter(
    (a) => a.status === "approved" || a.status === "rejected"
  );

  // Apply filters
  const filteredApprovals = completedApprovals.filter((approval) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const entity = getEntity(approval.entityType, approval.entityId);
      const entityNumber = entity?.number ?? "";
      const matchesSearch =
        entityNumber.toLowerCase().includes(searchLower) ||
        approval.requestedByName.toLowerCase().includes(searchLower) ||
        (approval.decidedByName?.toLowerCase().includes(searchLower) ?? false);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== "all" && approval.status !== statusFilter) return false;
    if (entityFilter !== "all" && approval.entityType !== entityFilter) return false;

    return true;
  });

  // Sort by decision date (most recent first)
  const sortedApprovals = [...filteredApprovals].sort(
    (a, b) =>
      new Date(b.decidedAt ?? b.updatedAt).getTime() -
      new Date(a.decidedAt ?? a.updatedAt).getTime()
  );

  // Pagination
  const totalPages = Math.ceil(sortedApprovals.length / pageSize);
  const paginatedApprovals = sortedApprovals.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  function getEntity(type: string, id: string) {
    if (type === "pr") {
      const pr = prMap.get(id);
      return pr ? { number: pr.prNumber, href: `/prs/${id}` } : null;
    }
    if (type === "po") {
      const po = poMap.get(id);
      return po ? { number: po.poNumber, href: `/pos/${id}` } : null;
    }
    if (type === "invoice") {
      const inv = invoiceMap.get(id);
      return inv ? { number: inv.invoiceNumber, href: `/invoices/${id}` } : null;
    }
    return null;
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusVariant = (status: ApprovalStatus): "success" | "error" | "warning" => {
    return status === "approved" ? "success" : status === "rejected" ? "error" : "warning";
  };

  const getEntityTypeBadge = (type: string) => {
    // STARK Design: All entity types use navy variants - no blue/purple
    const colors: Record<string, string> = {
      pr: "bg-stark-navy-10 text-stark-navy",
      po: "bg-stark-navy-10 text-stark-navy",
      invoice: "bg-stark-navy-10 text-stark-navy",
    };
    return colors[type] ?? "bg-gray-100 text-gray-700";
  };

  const statusOptions = [
    { value: "all", label: "All Decisions" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const entityOptions = [
    { value: "all", label: "All Types" },
    { value: "pr", label: "Purchase Requests" },
    { value: "po", label: "Purchase Orders" },
    { value: "invoice", label: "Invoices" },
  ];

  // Stats
  const stats = {
    total: completedApprovals.length,
    approved: completedApprovals.filter((a) => a.status === "approved").length,
    rejected: completedApprovals.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Decisions</div>
          <div className="text-2xl font-bold text-stark-navy">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Approved</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-2xl font-bold text-stark-navy">{stats.approved}</span>
          </div>
          <div className="text-xs text-gray-400">
            {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% approval rate
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Rejected</div>
          <div className="text-2xl font-bold text-stark-navy">{stats.rejected}</div>
          <div className="text-xs text-gray-400">
            {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% rejection rate
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history..."
            />
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setPage(1);
            }}
            className="w-36"
          />
          <Select
            options={entityOptions}
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value as typeof entityFilter);
              setPage(1);
            }}
            className="w-44"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Requested By
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Decision
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Decided By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedApprovals.map((approval) => {
              const entity = getEntity(approval.entityType, approval.entityId);
              return (
                <tr key={approval.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded uppercase ${getEntityTypeBadge(
                        approval.entityType
                      )}`}
                    >
                      {approval.entityType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entity ? (
                      <Link
                        href={entity.href}
                        className="font-medium text-stark-navy hover:underline"
                      >
                        {entity.number}
                      </Link>
                    ) : (
                      <span className="text-gray-400">{approval.entityId.slice(0, 8)}...</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {approval.requestedByName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(approval.amount, approval.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                      variant={getStatusVariant(approval.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {approval.decidedByName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(approval.decidedAt)}
                  </td>
                </tr>
              );
            })}
            {paginatedApprovals.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No approval history found
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
            {Math.min(page * pageSize, sortedApprovals.length)} of{" "}
            {sortedApprovals.length} records
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
