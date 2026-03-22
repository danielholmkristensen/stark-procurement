"use client";

/**
 * Approval Queue
 *
 * Grouped by approval reason with inline decision context.
 * Batch actions for routine approvals, aging indicators.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { List, Layers, Clock, AlertTriangle, CheckCircle, Users } from "lucide-react";
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
  GuidanceBanner,
  SectionSummary,
  PRIcon,
  POIcon,
  InvoiceIcon,
  WarningIcon,
} from "@/components/ui";
import type { EscalationLevel, Approval } from "@/lib/db";

type ViewMode = "flat" | "grouped";
type ApprovalReason = "threshold" | "discrepancy" | "policy" | "budget";

const REASON_ORDER: ApprovalReason[] = ["threshold", "discrepancy", "policy", "budget"];

const reasonLabels: Record<ApprovalReason, string> = {
  threshold: "THRESHOLD EXCEEDED",
  discrepancy: "DISCREPANCY RESOLUTION",
  policy: "POLICY EXCEPTION",
  budget: "BUDGET REVIEW",
};

const reasonDescriptions: Record<ApprovalReason, string> = {
  threshold: "Over your approval limit",
  discrepancy: "Invoice variance needs sign-off",
  policy: "New supplier or unusual terms",
  budget: "Department limit reached",
};

export function ApprovalQueue() {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<"all" | "pr" | "po" | "invoice">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");

  const pendingApprovals = usePendingApprovals();
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const prMap = new Map(allPRs?.map((pr) => [pr.id, pr]) ?? []);
  const poMap = new Map(allPOs?.map((po) => [po.id, po]) ?? []);
  const invoiceMap = new Map(allInvoices?.map((inv) => [inv.id, inv]) ?? []);

  // Determine approval reason
  const getApprovalReason = (approval: Approval): ApprovalReason => {
    // If it's an invoice and has discrepancy
    if (approval.entityType === "invoice") {
      const invoice = invoiceMap.get(approval.entityId);
      if (invoice?.status === "discrepancy") return "discrepancy";
    }
    // If amount exceeds threshold
    if (approval.amount > approval.threshold) return "threshold";
    // Default to policy for now
    return "policy";
  };

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

  // Group by reason
  const groupedApprovals = useMemo(() => {
    const groups: Record<ApprovalReason, Approval[]> = {
      threshold: [],
      discrepancy: [],
      policy: [],
      budget: [],
    };
    filteredApprovals.forEach((approval) => {
      const reason = getApprovalReason(approval);
      groups[reason].push(approval);
    });
    // Sort each group by date
    Object.values(groups).forEach((group) => {
      group.sort((a, b) => new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime());
    });
    return groups;
  }, [filteredApprovals]);

  // Calculate guidance data
  const guidanceData = useMemo(() => {
    const totalValue = filteredApprovals.reduce((sum, a) => sum + a.amount, 0);

    // Count blocking items
    const blockingPOs = filteredApprovals.filter(a => a.entityType === "po").length;
    const blockingPayments = filteredApprovals.filter(a => a.entityType === "invoice").length;

    // Find oldest waiting
    const oldest = filteredApprovals.reduce((oldest, a) => {
      if (!oldest) return a;
      return new Date(a.requestedAt) < new Date(oldest.requestedAt) ? a : oldest;
    }, null as Approval | null);

    const oldestDays = oldest
      ? Math.floor((Date.now() - new Date(oldest.requestedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Find batch-approvable items (same requester, under certain amount)
    const byRequester: Record<string, Approval[]> = {};
    filteredApprovals.forEach((a) => {
      if (!byRequester[a.requestedBy]) byRequester[a.requestedBy] = [];
      byRequester[a.requestedBy].push(a);
    });

    const batchCandidates = Object.entries(byRequester)
      .filter(([_, approvals]) => approvals.length >= 2)
      .map(([requesterId, approvals]) => ({
        requesterId,
        requesterName: approvals[0].requestedByName,
        count: approvals.length,
        totalValue: approvals.reduce((sum, a) => sum + a.amount, 0),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      total: filteredApprovals.length,
      totalValue,
      blockingPOs,
      blockingPayments,
      oldestDays,
      batchCandidates,
    };
  }, [filteredApprovals]);

  function getEntity(type: string, id: string) {
    if (type === "pr") {
      const pr = prMap.get(id);
      return pr ? { number: pr.prNumber, href: `/prs/${id}`, details: pr } : null;
    }
    if (type === "po") {
      const po = poMap.get(id);
      return po ? { number: po.poNumber, href: `/pos/${id}`, details: po } : null;
    }
    if (type === "invoice") {
      const inv = invoiceMap.get(id);
      return inv ? { number: inv.invoiceNumber, href: `/invoices/${id}`, details: inv } : null;
    }
    return null;
  }

  const EntityIcon = ({ type }: { type: string }) => {
    const iconClass = "text-gray-500";
    if (type === "pr") return <PRIcon size={14} className={iconClass} />;
    if (type === "po") return <POIcon size={14} className={iconClass} />;
    if (type === "invoice") return <InvoiceIcon size={14} className={iconClass} />;
    return null;
  };

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

  const getReasonEscalation = (reason: ApprovalReason): EscalationLevel | undefined => {
    switch (reason) {
      case "threshold": return "action";
      case "discrepancy": return "attention";
      default: return undefined;
    }
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

  const handleBatchApprove = async (approvals: Approval[]) => {
    for (const approval of approvals) {
      await approveRequest(approval.id, "current-user", "Current User", "Batch approved");
    }
  };

  // Stats
  const stats = [
    { label: "Total", value: pendingApprovals?.length ?? 0 },
    { label: "PRs", value: pendingApprovals?.filter((a) => a.entityType === "pr").length ?? 0 },
    { label: "POs", value: pendingApprovals?.filter((a) => a.entityType === "po").length ?? 0 },
    { label: "Invoices", value: pendingApprovals?.filter((a) => a.entityType === "invoice").length ?? 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Decision Impact Banner */}
      {viewMode === "grouped" && guidanceData.total > 0 && (
        <GuidanceBanner
          variant={guidanceData.oldestDays > 2 ? "action" : "info"}
          icon={<Clock size={20} />}
          title={`${guidanceData.total} approval${guidanceData.total !== 1 ? "s" : ""} waiting (${formatCurrencyShort(guidanceData.totalValue)})`}
          description={
            guidanceData.blockingPOs > 0 || guidanceData.blockingPayments > 0
              ? `${guidanceData.blockingPOs > 0 ? `${guidanceData.blockingPOs} blocking PO send` : ""}${guidanceData.blockingPOs > 0 && guidanceData.blockingPayments > 0 ? " • " : ""}${guidanceData.blockingPayments > 0 ? `${guidanceData.blockingPayments} blocking payment` : ""}${guidanceData.oldestDays > 0 ? ` • Oldest: ${guidanceData.oldestDays}d` : ""}`
              : undefined
          }
          action={
            guidanceData.batchCandidates.length > 0
              ? { label: "Approve All Routine", onClick: () => {} }
              : undefined
          }
        />
      )}

      {/* Batch Action Banner */}
      {viewMode === "grouped" && guidanceData.batchCandidates.length > 0 && (
        <GuidanceBanner
          variant="info"
          icon={<Users size={20} />}
          title="Quick Action Available"
          description={`${guidanceData.batchCandidates[0].count} items from ${guidanceData.batchCandidates[0].requesterName} (${formatCurrencyShort(guidanceData.batchCandidates[0].totalValue)})`}
          action={{
            label: `Approve All ${guidanceData.batchCandidates[0].count}`,
            onClick: () => {
              const approvals = filteredApprovals.filter(
                (a) => a.requestedBy === guidanceData.batchCandidates[0].requesterId
              );
              handleBatchApprove(approvals);
            },
          }}
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
                placeholder="Search approvals..."
              />
              <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value as typeof entityFilter)}>
                <option value="all">All Types</option>
                <option value="pr">Purchase Requests</option>
                <option value="po">Purchase Orders</option>
                <option value="invoice">Invoices</option>
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
              <Link href="/approvals/history">
                <Button variant="outline" size="sm">History</Button>
              </Link>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="flex flex-wrap gap-2 text-xs">
            {stats.map((stat) => (
              <span key={stat.label} className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
                {stat.value} {stat.label}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        {viewMode === "grouped" ? (
          <div className="p-4 space-y-4">
            {filteredApprovals.length === 0 ? (
              <div className="py-8 text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-600" />
                  </div>
                </div>
                <p className="text-gray-500">All caught up! No pending approvals.</p>
              </div>
            ) : (
              REASON_ORDER.map((reason) => {
                const approvals = groupedApprovals[reason];
                if (approvals.length === 0) return null;

                const totalValue = approvals.reduce((sum, a) => sum + a.amount, 0);

                return (
                  <CollapsibleSection
                    key={reason}
                    title={reasonLabels[reason]}
                    count={approvals.length}
                    defaultExpanded={reason === "threshold" || reason === "discrepancy"}
                    escalationLevel={getReasonEscalation(reason)}
                  >
                    <SectionSummary
                      totalValue={totalValue}
                      itemCount={approvals.length}
                    />
                    <div className="text-xs text-gray-500 px-3 py-1 bg-gray-50 border-b border-gray-100">
                      {reasonDescriptions[reason]}
                    </div>

                    <div className="divide-y divide-gray-100">
                      {approvals.map((approval) => (
                        <ApprovalCard
                          key={approval.id}
                          approval={approval}
                          entity={getEntity(approval.entityType, approval.entityId)}
                          EntityIcon={EntityIcon}
                          formatCurrency={formatCurrency}
                          formatDate={formatDate}
                          onApprove={() => handleApprove(approval.id)}
                          onReject={() => handleReject(approval.id)}
                        />
                      ))}
                    </div>
                  </CollapsibleSection>
                );
              })
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredApprovals.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                No pending approvals
              </div>
            ) : (
              filteredApprovals.map((approval) => (
                <ApprovalCard
                  key={approval.id}
                  approval={approval}
                  entity={getEntity(approval.entityType, approval.entityId)}
                  EntityIcon={EntityIcon}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  onApprove={() => handleApprove(approval.id)}
                  onReject={() => handleReject(approval.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ApprovalCardProps {
  approval: Approval;
  entity: { number: string; href: string; details?: unknown } | null;
  EntityIcon: React.ComponentType<{ type: string }>;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: Date) => string;
  onApprove: () => void;
  onReject: () => void;
}

function ApprovalCard({
  approval,
  entity,
  EntityIcon,
  formatCurrency,
  formatDate,
  onApprove,
  onReject,
}: ApprovalCardProps) {
  // Calculate days waiting
  const daysWaiting = Math.floor(
    (Date.now() - new Date(approval.requestedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverThreshold = approval.amount > approval.threshold;
  const overAmount = isOverThreshold ? approval.amount - approval.threshold : 0;

  return (
    <div className="p-4 hover:bg-gray-50">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <EscalationIndicator level={approval.escalationLevel} />
          <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
            <EntityIcon type={approval.entityType} />
            <span className="uppercase">{approval.entityType}</span>
          </div>
          {entity && (
            <Link href={entity.href} className="font-semibold text-gray-900 hover:underline">
              {entity.number}
            </Link>
          )}
        </div>
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {formatCurrency(approval.amount, approval.currency)}
          </div>
          {isOverThreshold && (
            <div className="flex items-center gap-1 text-xs text-stark-orange">
              <WarningIcon size={12} />
              <span>+{formatCurrency(overAmount, approval.currency)} over</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Row */}
      <div className="bg-gray-50 rounded p-3 mb-3 text-sm">
        <div className="flex items-center justify-between text-gray-600">
          <span>Requested by: <span className="font-medium text-gray-900">{approval.requestedByName}</span></span>
          <span className={daysWaiting > 2 ? "text-amber-600 font-medium" : "text-gray-500"}>
            Waiting: {daysWaiting}d
          </span>
        </div>
        {isOverThreshold && (
          <div className="mt-1 text-gray-500">
            Threshold: {formatCurrency(approval.threshold, approval.currency)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Link href={entity?.href || "#"}>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
          <Button variant="outline" size="sm">Request Info</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReject}>Reject</Button>
          <Button
            variant={approval.escalationLevel === "urgent" ? "action" : "primary"}
            size="sm"
            onClick={onApprove}
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}
