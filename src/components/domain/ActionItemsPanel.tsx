/**
 * Handle Now Queue
 *
 * Shows exceptions requiring human judgment with specific actions.
 * Each item has named problem type and inline action buttons.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  XCircle,
  DollarSign,
  Package,
  Clock,
  FileText,
  ClipboardList,
  Receipt,
} from "lucide-react";
import { usePurchaseRequests, usePurchaseOrders, useInvoices } from "@/hooks";
import { Card, CardHeader, CardTitle, Button } from "@/components/ui";

type ExceptionType =
  | "supplier_rejection"
  | "price_increase"
  | "quantity_partial"
  | "delivery_delay"
  | "invoice_discrepancy"
  | "overdue_po";

interface HandleNowItem {
  id: string;
  type: ExceptionType;
  entityType: "pr" | "po" | "invoice";
  entityId: string;
  title: string;
  description: string;
  impact?: string;
  urgency: "critical" | "high" | "medium";
  actions: Array<{
    label: string;
    href?: string;
    variant?: "action" | "primary" | "outline";
  }>;
}

const exceptionConfig: Record<
  ExceptionType,
  { icon: typeof XCircle; label: string; color: string }
> = {
  supplier_rejection: {
    icon: XCircle,
    label: "Supplier rejection",
    color: "text-red-600",
  },
  price_increase: {
    icon: DollarSign,
    label: "Price increase",
    color: "text-stark-orange",
  },
  quantity_partial: {
    icon: Package,
    label: "Quantity partial",
    color: "text-amber-600",
  },
  delivery_delay: {
    icon: Clock,
    label: "Delivery delay",
    color: "text-amber-600",
  },
  invoice_discrepancy: {
    icon: Receipt,
    label: "Invoice discrepancy",
    color: "text-stark-orange",
  },
  overdue_po: {
    icon: Clock,
    label: "Overdue",
    color: "text-red-600",
  },
};

export function ActionItemsPanel() {
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(value);

  const handleNowItems = useMemo(() => {
    const items: HandleNowItem[] = [];
    const now = new Date();

    // POs with issues
    (allPOs || []).forEach((po) => {
      // Overdue POs (sent but not confirmed, delivery date passed)
      if (
        po.status === "sent" &&
        !po.confirmedAt &&
        po.requestedDeliveryDate
      ) {
        const deliveryDate = new Date(po.requestedDeliveryDate);
        if (deliveryDate < now) {
          items.push({
            id: `po-overdue-${po.id}`,
            type: "overdue_po",
            entityType: "po",
            entityId: po.id,
            title: po.poNumber,
            description: `${po.supplierName} • No confirmation`,
            impact: formatCurrency(po.total),
            urgency: "critical",
            actions: [
              { label: "Contact Supplier", href: `/pos/${po.id}`, variant: "action" },
              { label: "Find Alternative", href: `/suppliers`, variant: "outline" },
            ],
          });
        }
      }

      // Confirmed but with delivery delay
      if (
        po.confirmedDeliveryDate &&
        po.requestedDeliveryDate &&
        po.status !== "received" &&
        po.status !== "completed"
      ) {
        const confirmed = new Date(po.confirmedDeliveryDate);
        const requested = new Date(po.requestedDeliveryDate);
        const delayDays = Math.ceil(
          (confirmed.getTime() - requested.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (delayDays > 0) {
          items.push({
            id: `po-delay-${po.id}`,
            type: "delivery_delay",
            entityType: "po",
            entityId: po.id,
            title: po.poNumber,
            description: `${po.supplierName} • ${delayDays}d delayed`,
            impact: `Need by ${requested.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
            urgency: delayDays > 3 ? "critical" : "high",
            actions: [
              { label: "Notify Store", href: `/pos/${po.id}`, variant: "action" },
              { label: "Accept Delay", href: `/pos/${po.id}`, variant: "outline" },
            ],
          });
        }
      }
    });

    // Invoices with discrepancies
    (allInvoices || []).forEach((inv) => {
      if (inv.status === "discrepancy" || inv.matchResult === "price_mismatch" || inv.matchResult === "quantity_mismatch") {
        const isPriceMismatch = inv.matchResult === "price_mismatch";
        const isQtyMismatch = inv.matchResult === "quantity_mismatch";

        items.push({
          id: `inv-${inv.id}`,
          type: isPriceMismatch
            ? "price_increase"
            : isQtyMismatch
            ? "quantity_partial"
            : "invoice_discrepancy",
          entityType: "invoice",
          entityId: inv.id,
          title: inv.invoiceNumber,
          description: `${inv.supplierName}`,
          impact: inv.discrepancyAmount
            ? `${inv.discrepancyAmount > 0 ? "+" : ""}${formatCurrency(inv.discrepancyAmount)} variance`
            : formatCurrency(inv.total),
          urgency: Math.abs(inv.discrepancyAmount || 0) > 10000 ? "critical" : "high",
          actions: isPriceMismatch
            ? [
                { label: "Accept", href: `/invoices/${inv.id}`, variant: "primary" },
                { label: "Reject", href: `/invoices/${inv.id}`, variant: "outline" },
                { label: "Negotiate", href: `/invoices/${inv.id}`, variant: "outline" },
              ]
            : [
                { label: "Review", href: `/invoices/${inv.id}`, variant: "action" },
                { label: "Resolve", href: `/invoices/${inv.id}`, variant: "outline" },
              ],
        });
      }
    });

    // Sort by urgency (critical first)
    const urgencyOrder = { critical: 0, high: 1, medium: 2 };
    items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return items;
  }, [allPRs, allPOs, allInvoices]);

  if (handleNowItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Handle Now</CardTitle>
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
          All caught up! No exceptions requiring your attention.
        </div>
      </Card>
    );
  }

  // Group by urgency
  const criticalItems = handleNowItems.filter((i) => i.urgency === "critical");
  const highItems = handleNowItems.filter((i) => i.urgency === "high");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Handle Now</CardTitle>
        <span className="px-2 py-0.5 text-xs font-medium bg-stark-orange-10 text-stark-orange rounded">
          {handleNowItems.length}
        </span>
      </CardHeader>
      <div className="divide-y divide-gray-100">
        {criticalItems.map((item) => (
          <HandleNowRow key={item.id} item={item} />
        ))}
        {highItems.map((item) => (
          <HandleNowRow key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}

function HandleNowRow({ item }: { item: HandleNowItem }) {
  const config = exceptionConfig[item.type];
  const Icon = config.icon;

  const urgencyIndicator = {
    critical: "bg-red-100 border-l-red-500",
    high: "bg-stark-orange-10 border-l-stark-orange",
    medium: "bg-amber-50 border-l-amber-400",
  }[item.urgency];

  return (
    <div
      className={`px-4 py-3 border-l-2 ${urgencyIndicator}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 mt-0.5">
            <Icon size={16} className={config.color} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium uppercase ${config.color}`}>
                {config.label}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {item.title}
              </span>
            </div>
            <p className="text-sm text-gray-600 truncate">{item.description}</p>
            {item.impact && (
              <p className="text-xs text-gray-500 mt-0.5">{item.impact}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.actions.slice(0, 2).map((action, idx) => (
            <Link key={idx} href={action.href || "#"}>
              <Button
                variant={action.variant || "primary"}
                size="sm"
              >
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
