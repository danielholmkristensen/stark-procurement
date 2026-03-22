"use client";

/**
 * PO List Component
 *
 * Filterable table showing all Purchase Orders with search,
 * status/supplier filters, grouped view with delivery risk guidance.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { List, Layers, LayoutGrid, Send, AlertTriangle, Clock } from "lucide-react";
import { usePurchaseOrders, useSuppliers, usePurchaseRequests } from "@/hooks";
import {
  SearchInput,
  Select,
  StatusBadge,
  Button,
  EscalationIndicator,
  getEscalationCardClass,
  CollapsibleSection,
  LinkedPRsBadge,
  GuidanceBanner,
  SectionSummary,
} from "@/components/ui";
import type { POStatus, PurchaseOrder, EscalationLevel } from "@/lib/db";
import {
  calculateBusinessPriority,
  getBusinessPriorityLabel,
  getBusinessPriorityDescription,
  shouldPriorityExpand,
  groupPOsByPriority,
  calculatePOStats,
  type BusinessPriority,
} from "@/lib/grouping";

type ViewMode = "flat" | "grouped";

const PAGE_SIZE = 20;
const PRIORITY_ORDER: BusinessPriority[] = ["critical", "high", "standard", "routine"];

export function POList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "all">("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [currentPage, setCurrentPage] = useState(1);

  const allPOs = usePurchaseOrders();
  const allSuppliers = useSuppliers();
  const allPRs = usePurchaseRequests();

  const filteredPOs = useMemo(() => {
    if (!allPOs) return [];
    return allPOs.filter((po) => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (!po.poNumber.toLowerCase().includes(searchLower) &&
            !po.supplierName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (statusFilter !== "all" && po.status !== statusFilter) return false;
      if (supplierFilter !== "all" && po.supplierId !== supplierFilter) return false;
      return true;
    });
  }, [allPOs, search, statusFilter, supplierFilter]);

  // Calculate guidance data
  const guidanceData = useMemo(() => {
    const now = new Date();

    // POs ready to send
    const readyToSend = filteredPOs.filter(
      (po) => po.status === "draft" || po.status === "approved"
    );
    const readyToSendValue = readyToSend.reduce((sum, po) => sum + po.total, 0);

    // Delivery risk - POs with delivery in next 48 hours not confirmed
    const deliveryRisk = filteredPOs.filter((po) => {
      if (po.status === "confirmed" || po.status === "received" || po.status === "completed") return false;
      if (!po.requestedDeliveryDate) return false;
      const deliveryDate = new Date(po.requestedDeliveryDate);
      const hoursUntil = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntil <= 48 && hoursUntil > 0;
    });

    // Overdue - delivery date passed but not received
    const overdue = filteredPOs.filter((po) => {
      if (po.status === "received" || po.status === "completed" || po.status === "cancelled") return false;
      if (!po.requestedDeliveryDate) return false;
      const deliveryDate = new Date(po.requestedDeliveryDate);
      return deliveryDate < now;
    });

    // Supplier consolidation opportunities - multiple drafts to same supplier
    const supplierDrafts: Record<string, PurchaseOrder[]> = {};
    readyToSend.forEach((po) => {
      if (!supplierDrafts[po.supplierId]) supplierDrafts[po.supplierId] = [];
      supplierDrafts[po.supplierId].push(po);
    });
    const bundlingOpportunities = Object.entries(supplierDrafts)
      .filter(([_, pos]) => pos.length > 1)
      .map(([supplierId, pos]) => ({
        supplierId,
        supplierName: pos[0].supplierName,
        count: pos.length,
        value: pos.reduce((sum, po) => sum + po.total, 0),
      }));

    return {
      readyToSend: readyToSend.length,
      readyToSendValue,
      deliveryRisk: deliveryRisk.length,
      overdue: overdue.length,
      bundlingOpportunities,
    };
  }, [filteredPOs]);

  // Grouped data
  const groupedPOs = useMemo(() => {
    return groupPOsByPriority(filteredPOs);
  }, [filteredPOs]);

  // Stats for compact display
  const stats = useMemo(() => {
    return calculatePOStats(filteredPOs);
  }, [filteredPOs]);

  const paginatedPOs = filteredPOs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(filteredPOs.length / PAGE_SIZE);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", minimumFractionDigits: 0 }).format(value);

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) return `DKK ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `DKK ${Math.round(value / 1000)}K`;
    return formatCurrency(value);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  };

  const getStatusVariant = (status: POStatus): "default" | "primary" | "success" | "warning" | "danger" => {
    const map: Record<POStatus, "default" | "primary" | "success" | "warning" | "danger"> = {
      draft: "default", pending_approval: "warning", approved: "primary",
      sent: "primary", confirmed: "success", partially_received: "warning",
      received: "success", completed: "success", cancelled: "danger",
    };
    return map[status] || "default";
  };

  const getStatusLabel = (status: POStatus): string => {
    const map: Record<POStatus, string> = {
      draft: "Draft", pending_approval: "Pending", approved: "Approved",
      sent: "Sent", confirmed: "Confirmed", partially_received: "Partial",
      received: "Received", completed: "Completed", cancelled: "Cancelled",
    };
    return map[status] || status;
  };

  if (!allPOs) {
    return <div className="bg-white rounded-lg border p-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Ready to Send Banner */}
      {viewMode === "grouped" && guidanceData.readyToSend > 0 && (
        <GuidanceBanner
          variant="info"
          title={`${guidanceData.readyToSend} ready • ${formatCurrencyShort(guidanceData.readyToSendValue)}`}
          description={
            guidanceData.bundlingOpportunities.length > 0
              ? `${guidanceData.bundlingOpportunities[0].count} could be bundled`
              : undefined
          }
          action={{ label: "Send", onClick: () => {} }}
        />
      )}

      {/* Delivery Risk Banner */}
      {viewMode === "grouped" && (guidanceData.deliveryRisk > 0 || guidanceData.overdue > 0) && (
        <GuidanceBanner
          variant="action"
          title={
            guidanceData.overdue > 0
              ? `${guidanceData.overdue} overdue`
              : `${guidanceData.deliveryRisk} at risk`
          }
          description={guidanceData.overdue > 0 && guidanceData.deliveryRisk > 0 ? `${guidanceData.deliveryRisk} more at risk` : undefined}
          action={{ label: "Review", href: "#delivery-risk" }}
        />
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Filters & View Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-3">
            <div className="flex gap-4 items-center flex-1">
              <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search POs..." />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as POStatus | "all")}>
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="confirmed">Confirmed</option>
                <option value="received">Received</option>
              </Select>
              <Select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
                <option value="all">All Suppliers</option>
                {allSuppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
              <Link href="/pos/kanban">
                <Button variant="outline" size="sm" title="Kanban view">
                  <LayoutGrid size={16} />
                </Button>
              </Link>
            </div>
          </div>

          {/* Compact Stats */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
              {stats.total} Total
            </span>
            {stats.critical > 0 && (
              <span className="px-2 py-1 bg-stark-orange-10 text-stark-orange rounded font-medium">
                {stats.critical} Critical
              </span>
            )}
            {stats.draft > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {stats.draft} Draft
              </span>
            )}
            {stats.urgent > 0 && (
              <span className="px-2 py-1 bg-stark-orange-10 text-stark-orange rounded font-medium">
                {stats.urgent} Urgent
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        {viewMode === "grouped" ? (
          <GroupedView
            groupedPOs={groupedPOs}
            allPRs={allPRs || []}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getStatusVariant={getStatusVariant}
            getStatusLabel={getStatusLabel}
          />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRs</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPOs.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No purchase orders found</td></tr>
                ) : paginatedPOs.map((po) => (
                  <POTableRow
                    key={po.id}
                    po={po}
                    allPRs={allPRs || []}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getStatusVariant={getStatusVariant}
                    getStatusLabel={getStatusLabel}
                  />
                ))}
              </tbody>
            </table>

            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredPOs.length)}-{Math.min(currentPage * PAGE_SIZE, filteredPOs.length)} of {filteredPOs.length}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PO Table Row Component
// ============================================================================

interface POTableRowProps {
  po: PurchaseOrder;
  allPRs: ReturnType<typeof usePurchaseRequests>;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined) => string;
  getStatusVariant: (status: POStatus) => "default" | "primary" | "success" | "warning" | "danger";
  getStatusLabel: (status: POStatus) => string;
}

function POTableRow({
  po,
  allPRs,
  formatCurrency,
  formatDate,
  getStatusVariant,
  getStatusLabel,
}: POTableRowProps) {
  return (
    <tr className={`hover:bg-gray-50 ${getEscalationCardClass(po.escalationLevel).replace('border-', 'border-l-2 border-l-')}`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        <div className="flex items-center gap-2">
          <EscalationIndicator level={po.escalationLevel} />
          {po.poNumber}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{po.supplierName}</td>
      <td className="px-4 py-3"><LinkedPRsBadge prIds={po.prIds} prs={allPRs || []} /></td>
      <td className="px-4 py-3 text-sm text-gray-500">{po.lineItems.length}</td>
      <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatCurrency(po.total)}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(po.requestedDeliveryDate)}</td>
      <td className="px-4 py-3"><StatusBadge status={getStatusLabel(po.status)} variant={getStatusVariant(po.status)} /></td>
      <td className="px-4 py-3 text-sm">
        {po.status === "draft" ? (
          <Button size="sm" className="text-xs">Send Now</Button>
        ) : (
          <Link href={`/pos/${po.id}`} className="text-gray-600 font-medium hover:text-stark-navy">View</Link>
        )}
      </td>
    </tr>
  );
}

// ============================================================================
// Grouped View Component
// ============================================================================

interface GroupedViewProps {
  groupedPOs: Map<BusinessPriority, PurchaseOrder[]>;
  allPRs: ReturnType<typeof usePurchaseRequests>;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined) => string;
  getStatusVariant: (status: POStatus) => "default" | "primary" | "success" | "warning" | "danger";
  getStatusLabel: (status: POStatus) => string;
}

function GroupedView({
  groupedPOs,
  allPRs,
  formatCurrency,
  formatDate,
  getStatusVariant,
  getStatusLabel,
}: GroupedViewProps) {
  const getPriorityEscalation = (priority: BusinessPriority): EscalationLevel | undefined => {
    switch (priority) {
      case "critical": return "urgent";
      case "high": return "action";
      default: return undefined;
    }
  };

  const getSectionStats = (pos: PurchaseOrder[]) => {
    const totalValue = pos.reduce((sum, po) => sum + po.total, 0);
    const urgentCount = pos.filter(
      (po) => po.escalationLevel === "urgent" || po.escalationLevel === "action"
    ).length;
    return { totalValue, urgentCount };
  };

  return (
    <div className="p-4 space-y-4">
      {PRIORITY_ORDER.map((priority) => {
        const pos = groupedPOs.get(priority) || [];
        if (pos.length === 0) return null;

        const sectionStats = getSectionStats(pos);

        return (
          <CollapsibleSection
            key={priority}
            title={
              <span className="flex items-center gap-2">
                {getBusinessPriorityLabel(priority).toUpperCase()} — {getBusinessPriorityDescription(priority)}
                {sectionStats.urgentCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-stark-orange-10 text-stark-orange rounded">
                    {sectionStats.urgentCount} urgent
                  </span>
                )}
              </span>
            }
            count={pos.length}
            defaultExpanded={shouldPriorityExpand(priority)}
            escalationLevel={getPriorityEscalation(priority)}
          >
            <SectionSummary
              totalValue={sectionStats.totalValue}
              itemCount={pos.length}
              urgentCount={sectionStats.urgentCount}
            />

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PRs</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pos.map((po) => (
                    <tr
                      key={po.id}
                      className={`hover:bg-gray-50 ${getEscalationCardClass(po.escalationLevel).replace('border-', 'border-l-2 border-l-')}`}
                    >
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <EscalationIndicator level={po.escalationLevel} size="sm" />
                          {po.poNumber}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">{po.supplierName}</td>
                      <td className="px-3 py-2"><LinkedPRsBadge prIds={po.prIds} prs={allPRs || []} /></td>
                      <td className="px-3 py-2 text-sm text-gray-900 font-medium">{formatCurrency(po.total)}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{formatDate(po.requestedDeliveryDate)}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={getStatusLabel(po.status)} variant={getStatusVariant(po.status)} />
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {po.status === "draft" ? (
                          <Button size="sm" className="text-xs">Send Now</Button>
                        ) : (
                          <Link href={`/pos/${po.id}`} className="text-gray-600 font-medium hover:text-stark-navy">View</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        );
      })}

      {Array.from(groupedPOs.values()).every((pos) => pos.length === 0) && (
        <div className="py-8 text-center text-gray-400">
          No purchase orders found
        </div>
      )}
    </div>
  );
}
