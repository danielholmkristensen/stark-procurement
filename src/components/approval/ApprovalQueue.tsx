"use client";

import { useState } from "react";
import Link from "next/link";
import {
  usePendingApprovals,
  usePurchaseRequests,
  usePurchaseOrders,
  useInvoices,
  approveRequest,
  rejectRequest,
} from "@/hooks";
import { Button, StatusBadge, SearchInput, Select } from "@/components/ui";
import type { EscalationLevel } from "@/lib/db";

export function ApprovalQueue() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<"all" | "pr" | "po" | "invoice">("all");

  const pendingApprovals = usePendingApprovals();
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const prMap = new Map(allPRs?.map((pr) => [pr.id, pr]) ?? []);
  const poMap = new Map(allPOs?.map((po) => [po.id, po]) ?? []);
  const invoiceMap = new Map(allInvoices?.map((inv) => [inv.id, inv]) ?? []);

  // Filter approvals
  const filteredApprovals = (pendingApprovals ?? []).filter((approval) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const entity = getEntity(approval.entityType, approval.entityId);
      const entityNumber = entity?.number ?? "";
      const matchesSearch =
        entityNumber.toLowerCase().includes(searchLower) ||
        approval.requestedByName.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (entityFilter !== "all" && approval.entityType !== entityFilter) return false;

    return true;
  });

  // Sort by escalation level (urgent first), then by date
  const sortedApprovals = [...filteredApprovals].sort((a, b) => {
    const levelOrder: Record<EscalationLevel, number> = {
      urgent: 0,
      action: 1,
      attention: 2,
      awareness: 3,
      ambient: 4,
    };
    const levelDiff = levelOrder[a.escalationLevel] - levelOrder[b.escalationLevel];
    if (levelDiff !== 0) return levelDiff;
    return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
  });

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };


  const getEntityTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      pr: "bg-blue-100 text-blue-700",
      po: "bg-green-100 text-green-700",
      invoice: "bg-purple-100 text-purple-700",
    };
    return colors[type] ?? "bg-gray-100 text-gray-700";
  };

  const handleApprove = async (id: string) => {
    await approveRequest(id, "current-user", "Current User", "Approved");
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Please provide a reason for rejection:");
    if (reason) {
      await rejectRequest(id, "current-user", "Current User", reason);
    }
  };

  // Stats
  const stats = {
    total: pendingApprovals?.length ?? 0,
    pr: pendingApprovals?.filter((a) => a.entityType === "pr").length ?? 0,
    po: pendingApprovals?.filter((a) => a.entityType === "po").length ?? 0,
    invoice: pendingApprovals?.filter((a) => a.entityType === "invoice").length ?? 0,
    urgent: pendingApprovals?.filter((a) => a.escalationLevel === "urgent").length ?? 0,
  };

  const entityOptions = [
    { value: "all", label: "All Types" },
    { value: "pr", label: "Purchase Requests" },
    { value: "po", label: "Purchase Orders" },
    { value: "invoice", label: "Invoices" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <button
          onClick={() => setEntityFilter("all")}
          className={`p-4 rounded-lg border text-left transition-all ${
            entityFilter === "all"
              ? "border-stark-navy ring-2 ring-stark-navy/20"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-sm text-gray-500">Total Pending</div>
          <div className="text-2xl font-bold text-stark-navy">{stats.total}</div>
        </button>
        <button
          onClick={() => setEntityFilter("pr")}
          className={`p-4 rounded-lg border text-left transition-all ${
            entityFilter === "pr"
              ? "border-stark-navy ring-2 ring-stark-navy/20"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-sm text-gray-500">PRs</div>
          <div className="text-2xl font-bold text-blue-600">{stats.pr}</div>
        </button>
        <button
          onClick={() => setEntityFilter("po")}
          className={`p-4 rounded-lg border text-left transition-all ${
            entityFilter === "po"
              ? "border-stark-navy ring-2 ring-stark-navy/20"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-sm text-gray-500">POs</div>
          <div className="text-2xl font-bold text-green-600">{stats.po}</div>
        </button>
        <button
          onClick={() => setEntityFilter("invoice")}
          className={`p-4 rounded-lg border text-left transition-all ${
            entityFilter === "invoice"
              ? "border-stark-navy ring-2 ring-stark-navy/20"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="text-sm text-gray-500">Invoices</div>
          <div className="text-2xl font-bold text-purple-600">{stats.invoice}</div>
        </button>
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <div className="text-sm text-red-600">Urgent</div>
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search approvals..."
            />
          </div>
          <Select
            options={entityOptions}
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as typeof entityFilter)}
            className="w-44"
          />
          <Link href="/approvals/history">
            <Button variant="outline" size="sm">
              View History
            </Button>
          </Link>
        </div>
      </div>

      {/* Approval Cards */}
      <div className="space-y-4">
        {sortedApprovals.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            {search || entityFilter !== "all"
              ? "No approvals match your filters"
              : "No pending approvals"}
          </div>
        ) : (
          sortedApprovals.map((approval) => {
            const entity = getEntity(approval.entityType, approval.entityId);
            return (
              <div
                key={approval.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded uppercase ${getEntityTypeBadge(
                          approval.entityType
                        )}`}
                      >
                        {approval.entityType}
                      </span>
                      {entity && (
                        <Link
                          href={entity.href}
                          className="text-lg font-semibold text-stark-navy hover:underline"
                        >
                          {entity.number}
                        </Link>
                      )}
                      {approval.escalationLevel === "urgent" && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium animate-pulse">
                          URGENT
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Requested By:</span>{" "}
                        <span className="font-medium">{approval.requestedByName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Requested:</span>{" "}
                        <span className="font-medium">{formatDate(approval.requestedAt)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>{" "}
                        <span className="font-bold text-stark-navy">
                          {formatCurrency(approval.amount, approval.currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Threshold:</span>{" "}
                        <span className="font-medium">
                          {formatCurrency(approval.threshold, approval.currency)}
                        </span>
                      </div>
                    </div>

                    {approval.amount > approval.threshold && (
                      <div className="mt-2 text-sm text-orange-600">
                        ⚠️ Amount exceeds threshold by{" "}
                        {formatCurrency(approval.amount - approval.threshold, approval.currency)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button size="sm" onClick={() => handleApprove(approval.id)}>
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleReject(approval.id)}>
                      Reject
                    </Button>
                    {entity && (
                      <Link href={entity.href}>
                        <Button variant="ghost" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
