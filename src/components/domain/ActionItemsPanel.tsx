/**
 * Action Items Panel
 *
 * Groups action items by escalation level:
 * - Urgent (expanded by default)
 * - Attention (collapsed by default)
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Eye, FileText, ClipboardList, Receipt } from "lucide-react";
import { usePurchaseRequests, usePurchaseOrders, useApprovals, useInvoices } from "@/hooks";
import {
  Card,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  Button,
  EscalationIndicator,
} from "@/components/ui";
import type { EscalationLevel } from "@/lib/db";

interface ActionItem {
  id: string;
  type: "pr" | "po" | "invoice" | "approval";
  entityId: string;
  title: string;
  description: string;
  value?: string;
  escalationLevel: EscalationLevel;
  actionLabel: string;
  href: string;
}

export function ActionItemsPanel() {
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allApprovals = useApprovals();
  const allInvoices = useInvoices();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(value);

  // Build action items from all entities
  const actionItems = useMemo(() => {
    const items: ActionItem[] = [];

    // PRs with urgent/action escalation
    (allPRs || []).forEach((pr) => {
      if (
        (pr.escalationLevel === "urgent" || pr.escalationLevel === "action") &&
        pr.status !== "converted" &&
        pr.status !== "rejected"
      ) {
        items.push({
          id: `pr-${pr.id}`,
          type: "pr",
          entityId: pr.id,
          title: pr.prNumber,
          description: `${pr.source.toUpperCase()} - ${pr.branchName}`,
          value: formatCurrency(pr.totalEstimatedValue),
          escalationLevel: pr.escalationLevel,
          actionLabel: "Review",
          href: `/prs/${pr.id}`,
        });
      }
    });

    // POs with urgent/action escalation
    (allPOs || []).forEach((po) => {
      if (
        (po.escalationLevel === "urgent" || po.escalationLevel === "action") &&
        po.status !== "completed" &&
        po.status !== "cancelled"
      ) {
        const action = po.status === "draft" ? "Send" : "Review";
        items.push({
          id: `po-${po.id}`,
          type: "po",
          entityId: po.id,
          title: po.poNumber,
          description: po.supplierName,
          value: formatCurrency(po.total),
          escalationLevel: po.escalationLevel,
          actionLabel: action,
          href: `/pos/${po.id}`,
        });
      }
    });

    // Invoices with discrepancies or urgent escalation
    (allInvoices || []).forEach((inv) => {
      if (
        (inv.escalationLevel === "urgent" || inv.escalationLevel === "action") ||
        inv.status === "discrepancy"
      ) {
        items.push({
          id: `inv-${inv.id}`,
          type: "invoice",
          entityId: inv.id,
          title: inv.invoiceNumber,
          description: inv.matchResult === "quantity_mismatch"
            ? "Qty discrepancy"
            : inv.matchResult === "price_mismatch"
            ? "Price discrepancy"
            : inv.supplierName,
          value: inv.discrepancyAmount
            ? formatCurrency(inv.discrepancyAmount)
            : formatCurrency(inv.total),
          escalationLevel: inv.escalationLevel,
          actionLabel: "Review",
          href: `/invoices/${inv.id}`,
        });
      }
    });

    // Pending approvals
    (allApprovals || []).forEach((approval) => {
      if (approval.status === "pending") {
        items.push({
          id: `approval-${approval.id}`,
          type: "approval",
          entityId: approval.entityId,
          title: `${approval.entityType.toUpperCase()} Approval`,
          description:
            approval.amount > approval.threshold
              ? "Over threshold"
              : "Awaiting approval",
          value: formatCurrency(approval.amount),
          escalationLevel: approval.escalationLevel,
          actionLabel: "Approve",
          href: `/approvals`,
        });
      }
    });

    return items;
  }, [allPRs, allPOs, allApprovals, allInvoices]);

  // Group by urgency
  const urgentItems = actionItems.filter(
    (item) => item.escalationLevel === "urgent"
  );
  const attentionItems = actionItems.filter(
    (item) => item.escalationLevel === "action" || item.escalationLevel === "attention"
  );

  const totalCount = actionItems.length;

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
        </CardHeader>
        <div className="px-5 py-8 text-center text-gray-400">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          All caught up! No urgent items.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Action Items</CardTitle>
        <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
          {totalCount}
        </span>
      </CardHeader>
      <div className="p-4 space-y-3">
        {/* Urgent Section */}
        {urgentItems.length > 0 && (
          <CollapsibleSection
            title="Urgent"
            count={urgentItems.length}
            defaultExpanded={true}
            escalationLevel="urgent"
          >
            <div className="divide-y divide-gray-100">
              {urgentItems.map((item) => (
                <ActionItemRow key={item.id} item={item} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Attention Section */}
        {attentionItems.length > 0 && (
          <CollapsibleSection
            title="Attention"
            count={attentionItems.length}
            defaultExpanded={urgentItems.length === 0}
            escalationLevel="action"
          >
            <div className="divide-y divide-gray-100">
              {attentionItems.map((item) => (
                <ActionItemRow key={item.id} item={item} />
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </Card>
  );
}

function ActionItemRow({ item }: { item: ActionItem }) {
  const TypeIcon = {
    pr: FileText,
    po: ClipboardList,
    invoice: Receipt,
    approval: AlertTriangle,
  }[item.type];

  return (
    <div className="px-3 py-3 flex items-center justify-between hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <TypeIcon size={16} className="text-gray-500" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EscalationIndicator level={item.escalationLevel} size="sm" />
          <div>
            <p className="text-sm font-medium text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500">
              {item.description}
              {item.value && <span className="ml-1 font-medium">{item.value}</span>}
            </p>
          </div>
        </div>
      </div>
      <Link href={item.href}>
        <Button
          variant={item.escalationLevel === "urgent" ? "action" : "primary"}
          size="sm"
        >
          {item.actionLabel}
        </Button>
      </Link>
    </div>
  );
}
