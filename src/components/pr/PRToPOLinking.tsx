"use client";

/**
 * PR-to-PO Linking Component (Screen A5)
 *
 * Shows traceability view of how PRs link to POs,
 * including bundled PRs and direct conversions.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePurchaseRequests, usePurchaseOrders } from "@/hooks";
import { Badge, SearchInput, StatusBadge } from "@/components/ui";
import type { PurchaseRequest, PurchaseOrder, PRSource } from "@/lib/db";

interface LinkageItem {
  pr: PurchaseRequest;
  po: PurchaseOrder | null;
  linkType: "bundled" | "direct" | "unlinked";
}

export function PRToPOLinking() {
  const [search, setSearch] = useState("");
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();

  // Create linkage map
  const linkages = useMemo<LinkageItem[]>(() => {
    if (!allPRs || !allPOs) return [];

    return allPRs.map((pr) => {
      // Find PO that contains this PR
      const linkedPO = allPOs.find((po) => po.prIds.includes(pr.id));

      if (!linkedPO) {
        return { pr, po: null, linkType: "unlinked" as const };
      }

      // Check if bundled (PO has multiple PRs) or direct (single PR)
      const linkType = linkedPO.prIds.length > 1 ? "bundled" : "direct";

      return { pr, po: linkedPO, linkType };
    });
  }, [allPRs, allPOs]);

  // Filter linkages
  const filteredLinkages = useMemo(() => {
    if (!search) return linkages;

    const searchLower = search.toLowerCase();
    return linkages.filter((link) => {
      const matchesPR = link.pr.prNumber.toLowerCase().includes(searchLower);
      const matchesPO = link.po?.poNumber.toLowerCase().includes(searchLower);
      return matchesPR || matchesPO;
    });
  }, [linkages, search]);

  // Get source label
  const getSourceLabel = (source: PRSource): string => {
    const labels: Record<PRSource, string> = {
      relex: "Relex",
      ecom: "ECom",
      salesapp: "SalesApp",
      manual: "Aspect4",
    };
    return labels[source];
  };

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get PO status variant
  const getPOStatusVariant = (status: string): "default" | "primary" | "success" | "warning" | "danger" => {
    switch (status) {
      case "confirmed":
      case "completed":
      case "received":
        return "success";
      case "sent":
      case "approved":
        return "primary";
      case "pending_approval":
      case "draft":
        return "default";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  // Get PO status label
  const getPOStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: "Draft",
      pending_approval: "Pending",
      approved: "Approved",
      sent: "Sent",
      confirmed: "Confirmed",
      partially_received: "Partial",
      received: "Received",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  if (!allPRs || !allPOs) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-pulse text-gray-400">Loading linkage data...</div>
      </div>
    );
  }

  // Calculate stats
  const linkedCount = linkages.filter((l) => l.po !== null).length;
  const bundledCount = linkages.filter((l) => l.linkType === "bundled").length;
  const directCount = linkages.filter((l) => l.linkType === "direct").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Total PRs</h4>
          <p className="text-2xl font-bold text-gray-900">{allPRs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Linked to PO</h4>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
            <span className="text-2xl font-bold text-stark-navy">{linkedCount}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Bundled</h4>
          <p className="text-2xl font-bold text-stark-navy">{bundledCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Direct</h4>
          <p className="text-2xl font-bold text-gray-700">{directCount}</p>
        </div>
      </div>

      {/* Linkage View */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">PR to PO Traceability</h3>
          <div className="w-64">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search PR or PO..."
            />
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredLinkages.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              No linkages found
            </div>
          ) : (
            filteredLinkages.map((link) => (
              <div
                key={link.pr.id}
                className="flex items-center gap-4 p-4 hover:bg-gray-50"
              >
                {/* PR Side */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="source">{getSourceLabel(link.pr.source)}</Badge>
                    <Link
                      href={`/prs/${link.pr.id}`}
                      className="font-medium hover:text-stark-orange"
                    >
                      {link.pr.prNumber}
                    </Link>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {link.pr.lineItems.length} items • {formatCurrency(link.pr.totalEstimatedValue)}
                  </p>
                </div>

                {/* Arrow */}
                <svg
                  className={`w-8 h-8 ${link.po ? "text-gray-400" : "text-gray-200"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>

                {/* PO Side */}
                {link.po ? (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="status"
                        colorVariant={link.linkType === "bundled" ? "primary" : "default"}
                      >
                        {link.linkType === "bundled" ? "Bundled" : "Direct"}
                      </Badge>
                      <Link
                        href={`/pos/${link.po.id}`}
                        className="font-medium hover:text-stark-orange"
                      >
                        {link.po.poNumber}
                      </Link>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {link.linkType === "bundled"
                        ? `Contains ${link.po.prIds.length} PRs`
                        : `To ${link.po.supplierName}`}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1">
                    <span className="text-gray-400 text-sm">Not linked to PO</span>
                  </div>
                )}

                {/* Status */}
                {link.po && (
                  <StatusBadge
                    status={getPOStatusLabel(link.po.status)}
                    variant={getPOStatusVariant(link.po.status)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
