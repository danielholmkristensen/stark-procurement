/**
 * STARK Procurement - Grouping Utilities
 *
 * Utility functions for grouping and prioritization in PR and PO lists.
 */

import type { PurchaseRequest, PurchaseOrder, EscalationLevel } from "@/lib/db";

// ============================================================================
// VALUE BAND UTILITIES (for PRs)
// ============================================================================

export type ValueBand = "high" | "medium" | "low";

export interface ValueBandConfig {
  high: number; // Threshold for high value (> this amount)
  medium: number; // Threshold for medium value (> this amount)
}

const DEFAULT_VALUE_BANDS: ValueBandConfig = {
  high: 100000, // > DKK 100K
  medium: 10000, // > DKK 10K
};

/**
 * Determine the value band for a given amount
 */
export function getValueBand(
  value: number,
  config: ValueBandConfig = DEFAULT_VALUE_BANDS
): ValueBand {
  if (value > config.high) return "high";
  if (value > config.medium) return "medium";
  return "low";
}

/**
 * Get display label for value band
 */
export function getValueBandLabel(band: ValueBand): string {
  switch (band) {
    case "high":
      return "High Value";
    case "medium":
      return "Medium Value";
    case "low":
      return "Low Value";
  }
}

/**
 * Get description for value band
 */
export function getValueBandDescription(band: ValueBand): string {
  switch (band) {
    case "high":
      return "> DKK 100K";
    case "medium":
      return "DKK 10K-100K";
    case "low":
      return "< DKK 10K";
  }
}

// ============================================================================
// PO LINKAGE STATUS UTILITIES (for PRs)
// ============================================================================

export type POLinkageStatus = "unlinked" | "direct" | "bundled";

export interface POLinkageInfo {
  status: POLinkageStatus;
  poId?: string;
  poNumber?: string;
  bundleCount?: number;
}

/**
 * Determine PR→PO linkage status
 */
export function getPOLinkageStatus(
  pr: PurchaseRequest,
  allPOs: PurchaseOrder[]
): POLinkageInfo {
  // Find POs that reference this PR
  const linkedPOs = allPOs.filter((po) => po.prIds.includes(pr.id));

  if (linkedPOs.length === 0) {
    return { status: "unlinked" };
  }

  if (linkedPOs.length === 1) {
    const po = linkedPOs[0];
    // Check if this PO has multiple PRs (bundled)
    if (po.prIds.length > 1) {
      return {
        status: "bundled",
        poId: po.id,
        poNumber: po.poNumber,
        bundleCount: po.prIds.length,
      };
    }
    return {
      status: "direct",
      poId: po.id,
      poNumber: po.poNumber,
    };
  }

  // Multiple POs (rare, but possible)
  return {
    status: "bundled",
    bundleCount: linkedPOs.length,
  };
}

/**
 * Get display label for linkage status
 */
export function getLinkageStatusLabel(info: POLinkageInfo): string {
  switch (info.status) {
    case "unlinked":
      return "Unlinked";
    case "direct":
      return `→ ${info.poNumber}`;
    case "bundled":
      return `Bundled (${info.bundleCount})`;
  }
}

// ============================================================================
// BUSINESS PRIORITY UTILITIES (for POs)
// ============================================================================

export type BusinessPriority = "critical" | "high" | "standard" | "routine";

export interface BusinessPriorityInfo {
  priority: BusinessPriority;
  score: number;
  urgencyScore: number;
  importanceScore: number;
  valueScore: number;
}

// Escalation level to importance score mapping
const ESCALATION_IMPORTANCE: Record<EscalationLevel, number> = {
  urgent: 100,
  action: 80,
  attention: 60,
  awareness: 40,
  ambient: 20,
};

/**
 * Calculate business priority for a PO
 * Composite score = Urgency(40%) + Importance(35%) + Value(25%)
 */
export function calculateBusinessPriority(po: PurchaseOrder): BusinessPriorityInfo {
  // Urgency: Days until delivery (1d=100, 3d=75, 7d=50, later=25)
  const now = new Date();
  const deliveryDate = po.requestedDeliveryDate
    ? new Date(po.requestedDeliveryDate)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

  const daysUntilDelivery = Math.max(
    0,
    Math.ceil((deliveryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
  );

  let urgencyScore: number;
  if (daysUntilDelivery <= 1) urgencyScore = 100;
  else if (daysUntilDelivery <= 3) urgencyScore = 75;
  else if (daysUntilDelivery <= 7) urgencyScore = 50;
  else urgencyScore = 25;

  // Importance: Escalation level mapping
  const importanceScore = ESCALATION_IMPORTANCE[po.escalationLevel] || 20;

  // Value: Log scale (DKK 1K=20, 10K=40, 100K=60, 1M=80, 10M=100)
  const valueScore = Math.min(100, Math.max(0, 20 * Math.log10(po.total / 100)));

  // Composite score
  const score = urgencyScore * 0.4 + importanceScore * 0.35 + valueScore * 0.25;

  // Determine priority bucket
  let priority: BusinessPriority;
  if (score >= 75) priority = "critical";
  else if (score >= 50) priority = "high";
  else if (score >= 25) priority = "standard";
  else priority = "routine";

  return {
    priority,
    score,
    urgencyScore,
    importanceScore,
    valueScore,
  };
}

/**
 * Get display label for business priority
 */
export function getBusinessPriorityLabel(priority: BusinessPriority): string {
  switch (priority) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "standard":
      return "Standard";
    case "routine":
      return "Routine";
  }
}

/**
 * Get description for business priority
 */
export function getBusinessPriorityDescription(priority: BusinessPriority): string {
  switch (priority) {
    case "critical":
      return "Immediate Action Required";
    case "high":
      return "Act Today";
    case "standard":
      return "Within SLA";
    case "routine":
      return "No Rush";
  }
}

/**
 * Should this priority level be expanded by default?
 */
export function shouldPriorityExpand(priority: BusinessPriority): boolean {
  return priority === "critical" || priority === "high";
}

// ============================================================================
// SOURCE GROUPING UTILITIES (for PRs)
// ============================================================================

import type { PRSource } from "@/lib/db";

export const SOURCE_ORDER: PRSource[] = ["relex", "ecom", "salesapp", "manual"];

export function getSourceLabel(source: PRSource): string {
  switch (source) {
    case "relex":
      return "RELEX";
    case "ecom":
      return "ECOM";
    case "salesapp":
      return "SALESAPP";
    case "manual":
      return "MANUAL";
  }
}

export function getSourceDescription(source: PRSource): string {
  switch (source) {
    case "relex":
      return "Automated Replenishment";
    case "ecom":
      return "Drop Shipment";
    case "salesapp":
      return "Salesperson Requests";
    case "manual":
      return "Manual Entry";
  }
}

// ============================================================================
// GROUPING HELPERS
// ============================================================================

/**
 * Group PRs by source and then by value band
 */
export function groupPRsBySourceAndValue(
  prs: PurchaseRequest[]
): Map<PRSource, Map<ValueBand, PurchaseRequest[]>> {
  const grouped = new Map<PRSource, Map<ValueBand, PurchaseRequest[]>>();

  // Initialize with all sources
  for (const source of SOURCE_ORDER) {
    grouped.set(source, new Map<ValueBand, PurchaseRequest[]>([
      ["high", []],
      ["medium", []],
      ["low", []],
    ]));
  }

  // Group PRs
  for (const pr of prs) {
    const sourceGroup = grouped.get(pr.source);
    if (sourceGroup) {
      const band = getValueBand(pr.totalEstimatedValue);
      const bandGroup = sourceGroup.get(band);
      if (bandGroup) {
        bandGroup.push(pr);
      }
    }
  }

  return grouped;
}

/**
 * Group POs by business priority
 */
export function groupPOsByPriority(
  pos: PurchaseOrder[]
): Map<BusinessPriority, PurchaseOrder[]> {
  const grouped = new Map<BusinessPriority, PurchaseOrder[]>([
    ["critical", []],
    ["high", []],
    ["standard", []],
    ["routine", []],
  ]);

  for (const po of pos) {
    const { priority } = calculateBusinessPriority(po);
    const group = grouped.get(priority);
    if (group) {
      group.push(po);
    }
  }

  return grouped;
}

// ============================================================================
// COMPACT STATS HELPERS
// ============================================================================

/**
 * Calculate compact stats for PR list
 */
export function calculatePRStats(prs: PurchaseRequest[]) {
  const total = prs.length;
  const bySource: Record<PRSource, number> = {
    relex: 0,
    ecom: 0,
    salesapp: 0,
    manual: 0,
  };
  let urgent = 0;

  for (const pr of prs) {
    bySource[pr.source]++;
    if (pr.escalationLevel === "urgent" || pr.escalationLevel === "action") {
      urgent++;
    }
  }

  return { total, bySource, urgent };
}

/**
 * Calculate compact stats for PO list
 */
export function calculatePOStats(pos: PurchaseOrder[]) {
  const total = pos.length;
  let critical = 0;
  let draft = 0;
  let urgent = 0;

  for (const po of pos) {
    const { priority } = calculateBusinessPriority(po);
    if (priority === "critical") critical++;
    if (po.status === "draft") draft++;
    if (po.escalationLevel === "urgent" || po.escalationLevel === "action") {
      urgent++;
    }
  }

  return { total, critical, draft, urgent };
}
