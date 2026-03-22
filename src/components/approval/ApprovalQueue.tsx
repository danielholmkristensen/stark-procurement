"use client";

/**
 * Approval Queue
 *
 * Grouped by escalation level with collapsible sections.
 * Urgent/Action expanded by default, others collapsed.
 * Follows Command Center UX principles.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  usePendingApprovals,
  usePurchaseRequests,
  usePurchaseOrders,
  useInvoices,
  approveRequest,
  rejectRequest,
} from "@/hooks";
import {
  Button,
  SearchInput,
  Select,
  EscalationIndicator,
  CollapsibleSection,
  shouldExpandByDefault,
  CompactStats,
  PRIcon,
  POIcon,
  InvoiceIcon,
  WarningIcon,
} from "@/components/ui";
import type { EscalationLevel, Approval } from "@/lib/db";

const escalationLabels: Record<EscalationLevel, string> = {
  urgent: "Urgent",
  action: "Action Required",
  attention: "Needs Review",
  awareness: "Pending",
  ambient: "New",
};

const escalationOrder: EscalationLevel[] = ["urgent", "action", "attention", "awareness", "ambient"];

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
  const filteredApprovals = useMemo(() => {
    return (pendingApprovals ?? []).filter((approval) => {
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
  }, [pendingApprovals, search, entityFilter]);

  // Group by escalation level
  const groupedApprovals = useMemo(() => {
    const groups: Record<EscalationLevel, Approval[]> = {
      urgent: [],
      action: [],
      attention: [],
      awareness: [],
      ambient: [],
    };
    filteredApprovals.forEach((approval) => {
      groups[approval.escalationLevel].push(approval);
    });
    // Sort each group by date
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    });
    return groups;
  }, [filteredApprovals]);

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

  const EntityIcon = ({ type }: { type: string }) => {
    const iconClass = "text-stark-navy";
    if (type === "pr") return <PRIcon size={14} className={iconClass} />;
    if (type === "po") return <POIcon size={14} className={iconClass} />;
    if (type === "invoice") return <InvoiceIcon size={14} className={iconClass} />;
    return null;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
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

  // Stats for compact bar
  const stats = [
    {
      label: "Total",
      value: pendingApprovals?.length ?? 0,
      filter: "all",
      variant: "default" as const,
    },
    {
      label: "PRs",
      value: pendingApprovals?.filter((a) => a.entityType === "pr").length ?? 0,
      filter: "pr",
    },
    {
      label: "POs",
      value: pendingApprovals?.filter((a) => a.entityType === "po").length ?? 0,
      filter: "po",
    },
    {
      label: "Invoices",
      value: pendingApprovals?.filter((a) => a.entityType === "invoice").length ?? 0,
      filter: "invoice",
    },
    {
      label: "Urgent",
      value: pendingApprovals?.filter((a) => a.escalationLevel === "urgent").length ?? 0,
      variant: "action" as const,
    },
  ];

  const entityOptions = [
    { value: "all", label: "All Types" },
    { value: "pr", label: "Purchase Requests" },
    { value: "po", label: "Purchase Orders" },
    { value: "invoice", label: "Invoices" },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Stats + Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <CompactStats
            stats={stats}
            activeFilter={entityFilter}
            onFilterChange={(f) => setEntityFilter(f as typeof entityFilter)}
          />
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search approvals..."
            />
          </div>
          <Link href="/approvals/history">
            <Button variant="outline" size="sm">
              History
            </Button>
          </Link>
        </div>
      </div>

      {/* Grouped Approvals */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            {search || entityFilter !== "all"
              ? "No approvals match your filters"
              : "No pending approvals"}
          </div>
        ) : (
          escalationOrder.map((level) => {
            const approvals = groupedApprovals[level];
            if (approvals.length === 0) return null;

            return (
              <CollapsibleSection
                key={level}
                title={escalationLabels[level]}
                count={approvals.length}
                defaultExpanded={shouldExpandByDefault(level)}
                escalationLevel={level}
              >
                {approvals.map((approval) => {
                  const entity = getEntity(approval.entityType, approval.entityId);
                  return (
                    <div
                      key={approval.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <EscalationIndicator level={approval.escalationLevel} />
                        <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-stark-navy">
                          <EntityIcon type={approval.entityType} />
                          <span className="uppercase">{approval.entityType}</span>
                        </div>
                        {entity && (
                          <Link
                            href={entity.href}
                            className="font-semibold text-stark-navy hover:underline"
                          >
                            {entity.number}
                          </Link>
                        )}
                        <span className="text-sm text-gray-500 truncate">
                          {approval.requestedByName}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-stark-navy">
                            {formatCurrency(approval.amount, approval.currency)}
                          </div>
                          {approval.amount > approval.threshold && (
                            <div className="flex items-center gap-1 text-xs text-stark-orange">
                              <WarningIcon size={12} />
                              <span>+{formatCurrency(approval.amount - approval.threshold, approval.currency)}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 w-16">
                          {formatDate(approval.requestedAt)}
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(approval.id)}>
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleReject(approval.id)}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CollapsibleSection>
            );
          })
        )}
      </div>
    </div>
  );
}
