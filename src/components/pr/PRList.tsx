"use client";

/**
 * PR List Component (Screen A1)
 *
 * Filterable table showing all Purchase Requests with search,
 * source/status filters, pagination, and grouped view.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { List, Layers } from "lucide-react";
import { usePurchaseRequests, usePurchaseOrders } from "@/hooks";
import {
  Badge,
  SourceBadge,
  StatusBadge,
  SearchInput,
  Select,
  DateInput,
  Button,
  EscalationIndicator,
  getEscalationCardClass,
  CollapsibleSection,
  LinkageStatusBadge,
} from "@/components/ui";
import type { PRSource, PRStatus, PurchaseRequest } from "@/lib/db";
import {
  getValueBand,
  getValueBandLabel,
  getValueBandDescription,
  getPOLinkageStatus,
  groupPRsBySourceAndValue,
  calculatePRStats,
  getSourceLabel,
  getSourceDescription,
  SOURCE_ORDER,
  type ValueBand,
} from "@/lib/grouping";

interface PRListProps {
  initialSource?: PRSource | "all";
  initialStatus?: PRStatus | "all";
}

type ViewMode = "flat" | "grouped";

const PAGE_SIZE = 20;
const VALUE_BAND_ORDER: ValueBand[] = ["high", "medium", "low"];

export function PRList({ initialSource = "all", initialStatus = "all" }: PRListProps) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<PRSource | "all">(initialSource);
  const [statusFilter, setStatusFilter] = useState<PRStatus | "all">(initialStatus);
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("flat");

  // Fetch all PRs and POs
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();

  // Apply filters
  const filteredPRs = useMemo(() => {
    if (!allPRs) return [];

    return allPRs.filter((pr) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesPR =
          pr.prNumber.toLowerCase().includes(searchLower) ||
          pr.branchName.toLowerCase().includes(searchLower) ||
          pr.requesterName.toLowerCase().includes(searchLower);
        if (!matchesPR) return false;
      }

      // Source filter
      if (sourceFilter !== "all" && pr.source !== sourceFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && pr.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        const prDate = pr.requestedDeliveryDate ? new Date(pr.requestedDeliveryDate) : null;
        if (!prDate || prDate.toDateString() !== filterDate.toDateString()) {
          return false;
        }
      }

      return true;
    });
  }, [allPRs, search, sourceFilter, statusFilter, dateFilter]);

  // Grouped data
  const groupedPRs = useMemo(() => {
    return groupPRsBySourceAndValue(filteredPRs);
  }, [filteredPRs]);

  // Stats for compact display
  const stats = useMemo(() => {
    return calculatePRStats(filteredPRs);
  }, [filteredPRs]);

  // Pagination (only for flat view)
  const totalPages = Math.ceil(filteredPRs.length / PAGE_SIZE);
  const paginatedPRs = filteredPRs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: PRStatus): "default" | "primary" | "success" | "warning" | "danger" => {
    switch (status) {
      case "draft":
        return "default";
      case "pending":
        return "primary";
      case "approved":
        return "success";
      case "converted":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  // Get status label
  const getStatusLabel = (status: PRStatus): string => {
    switch (status) {
      case "draft":
        return "Draft";
      case "pending":
        return "New";
      case "approved":
        return "Reviewed";
      case "converted":
        return "Linked to PO";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  if (!allPRs) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-pulse text-gray-400">Loading purchase requests...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Filters & View Toggle */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-3">
          <div className="flex flex-wrap gap-4 items-center flex-1">
            <div className="min-w-64">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                placeholder="Search PRs..."
              />
            </div>
            <Select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as PRSource | "all")}
            >
              <option value="all">All Sources</option>
              <option value="relex">Relex</option>
              <option value="ecom">ECom</option>
              <option value="salesapp">SalesApp</option>
              <option value="manual">Manual</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PRStatus | "all")}
            >
              <option value="all">All Status</option>
              <option value="pending">New</option>
              <option value="approved">Reviewed</option>
              <option value="converted">Linked</option>
              <option value="rejected">Rejected</option>
            </Select>
            <DateInput
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
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
          </div>
        </div>

        {/* Compact Stats */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded font-medium">
            {stats.total} Total
          </span>
          {stats.bySource.relex > 0 && (
            <span className="px-2 py-1 bg-stark-navy-10 text-stark-navy rounded">
              {stats.bySource.relex} Relex
            </span>
          )}
          {stats.bySource.ecom > 0 && (
            <span className="px-2 py-1 bg-stark-navy-10 text-stark-navy rounded">
              {stats.bySource.ecom} ECom
            </span>
          )}
          {stats.bySource.salesapp > 0 && (
            <span className="px-2 py-1 bg-stark-navy-10 text-stark-navy rounded">
              {stats.bySource.salesapp} SalesApp
            </span>
          )}
          {stats.bySource.manual > 0 && (
            <span className="px-2 py-1 bg-stark-navy-10 text-stark-navy rounded">
              {stats.bySource.manual} Manual
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
          groupedPRs={groupedPRs}
          allPOs={allPOs || []}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusVariant={getStatusVariant}
          getStatusLabel={getStatusLabel}
        />
      ) : (
        <>
          {/* Flat Table View */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PR ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Need Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Link
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedPRs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                      No purchase requests found
                    </td>
                  </tr>
                ) : (
                  paginatedPRs.map((pr) => (
                    <PRTableRow
                      key={pr.id}
                      pr={pr}
                      allPOs={allPOs || []}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      getStatusVariant={getStatusVariant}
                      getStatusLabel={getStatusLabel}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredPRs.length)}-
              {Math.min(currentPage * PAGE_SIZE, filteredPRs.length)} of {filteredPRs.length} PRs
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 3) {
                  pageNum = i + 1;
                } else if (currentPage === 1) {
                  pageNum = i + 1;
                } else if (currentPage === totalPages) {
                  pageNum = totalPages - 2 + i;
                } else {
                  pageNum = currentPage - 1 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded text-sm ${
                      currentPage === pageNum
                        ? "bg-stark-navy text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// PR Table Row Component
// ============================================================================

interface PRTableRowProps {
  pr: PurchaseRequest;
  allPOs: ReturnType<typeof usePurchaseOrders>;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined) => string;
  getStatusVariant: (status: PRStatus) => "default" | "primary" | "success" | "warning" | "danger";
  getStatusLabel: (status: PRStatus) => string;
}

function PRTableRow({
  pr,
  allPOs,
  formatCurrency,
  formatDate,
  getStatusVariant,
  getStatusLabel,
}: PRTableRowProps) {
  const linkageInfo = getPOLinkageStatus(pr, allPOs || []);

  return (
    <tr className={`hover:bg-gray-50 ${getEscalationCardClass(pr.escalationLevel).replace('border-', 'border-l-2 border-l-')}`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        <div className="flex items-center gap-2">
          <EscalationIndicator level={pr.escalationLevel} />
          {pr.prNumber}
        </div>
      </td>
      <td className="px-4 py-3">
        <SourceBadge source={pr.source} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {pr.lineItems.length}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatCurrency(pr.totalEstimatedValue)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {pr.branchName}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(pr.requestedDeliveryDate)}
      </td>
      <td className="px-4 py-3">
        <LinkageStatusBadge linkage={linkageInfo} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge
          status={getStatusLabel(pr.status)}
          variant={getStatusVariant(pr.status)}
        />
      </td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/prs/${pr.id}`}
          className="text-stark-navy font-medium hover:text-stark-orange"
        >
          View →
        </Link>
      </td>
    </tr>
  );
}

// ============================================================================
// Grouped View Component
// ============================================================================

interface GroupedViewProps {
  groupedPRs: Map<PRSource, Map<ValueBand, PurchaseRequest[]>>;
  allPOs: ReturnType<typeof usePurchaseOrders>;
  formatCurrency: (value: number) => string;
  formatDate: (date: Date | undefined) => string;
  getStatusVariant: (status: PRStatus) => "default" | "primary" | "success" | "warning" | "danger";
  getStatusLabel: (status: PRStatus) => string;
}

function GroupedView({
  groupedPRs,
  allPOs,
  formatCurrency,
  formatDate,
  getStatusVariant,
  getStatusLabel,
}: GroupedViewProps) {
  return (
    <div className="p-4 space-y-4">
      {SOURCE_ORDER.map((source) => {
        const valueGroups = groupedPRs.get(source);
        if (!valueGroups) return null;

        // Count total PRs for this source
        let sourceTotal = 0;
        valueGroups.forEach((prs) => {
          sourceTotal += prs.length;
        });

        if (sourceTotal === 0) return null;

        // Check if any PR in this source has urgent escalation
        let hasUrgent = false;
        valueGroups.forEach((prs) => {
          if (prs.some((pr) => pr.escalationLevel === "urgent" || pr.escalationLevel === "action")) {
            hasUrgent = true;
          }
        });

        return (
          <CollapsibleSection
            key={source}
            title={`${getSourceLabel(source)} — ${getSourceDescription(source)}`}
            count={sourceTotal}
            defaultExpanded={hasUrgent || source === "relex"}
          >
            <div className="p-3 space-y-3">
              {VALUE_BAND_ORDER.map((band) => {
                const prs = valueGroups.get(band) || [];
                if (prs.length === 0) return null;

                // Check if any PR in this band has urgent escalation
                const bandHasUrgent = prs.some(
                  (pr) => pr.escalationLevel === "urgent" || pr.escalationLevel === "action"
                );

                return (
                  <CollapsibleSection
                    key={band}
                    title={`${getValueBandLabel(band)} ${getValueBandDescription(band)}`}
                    count={prs.length}
                    defaultExpanded={bandHasUrgent || band === "high"}
                    variant="compact"
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PR ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Need Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">PO Link</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {prs.map((pr) => {
                            const linkageInfo = getPOLinkageStatus(pr, allPOs || []);
                            return (
                              <tr
                                key={pr.id}
                                className={`hover:bg-gray-50 ${getEscalationCardClass(pr.escalationLevel).replace('border-', 'border-l-2 border-l-')}`}
                              >
                                <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                  <div className="flex items-center gap-2">
                                    <EscalationIndicator level={pr.escalationLevel} size="sm" />
                                    {pr.prNumber}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-500">{pr.lineItems.length}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(pr.totalEstimatedValue)}</td>
                                <td className="px-3 py-2 text-sm text-gray-500">{pr.branchName}</td>
                                <td className="px-3 py-2 text-sm text-gray-500">{formatDate(pr.requestedDeliveryDate)}</td>
                                <td className="px-3 py-2">
                                  <LinkageStatusBadge linkage={linkageInfo} />
                                </td>
                                <td className="px-3 py-2">
                                  <StatusBadge
                                    status={getStatusLabel(pr.status)}
                                    variant={getStatusVariant(pr.status)}
                                  />
                                </td>
                                <td className="px-3 py-2 text-sm">
                                  <Link
                                    href={`/prs/${pr.id}`}
                                    className="text-stark-navy font-medium hover:text-stark-orange"
                                  >
                                    View →
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CollapsibleSection>
                );
              })}
            </div>
          </CollapsibleSection>
        );
      })}

      {/* Empty state */}
      {Array.from(groupedPRs.values()).every((valueGroups) =>
        Array.from(valueGroups.values()).every((prs) => prs.length === 0)
      ) && (
        <div className="py-8 text-center text-gray-400">
          No purchase requests found
        </div>
      )}
    </div>
  );
}
