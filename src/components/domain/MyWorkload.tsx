/**
 * My Queue Today Component
 *
 * Personal work queue grouped by TIME PRESSURE, not entity type.
 * Helps buyer plan their day around deadlines.
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Clock, CalendarClock, Calendar, ChevronRight } from "lucide-react";
import { usePurchaseRequests, usePurchaseOrders, useInvoices, useApprovals } from "@/hooks";
import { Card, CardHeader, CardTitle } from "@/components/ui";

interface TimeGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: WorkItem[];
  variant: "urgent" | "today" | "flexible";
}

interface WorkItem {
  id: string;
  label: string;
  count: number;
  href: string;
}

export function MyWorkload() {
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();
  const allApprovals = useApprovals();

  const timeGroups = useMemo(() => {
    const now = new Date();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const groups: TimeGroup[] = [];

    // === BEFORE CUT-OFF (next few hours) ===
    // POs that need to go out for today's cut-offs
    const urgentPOs = (allPOs || []).filter((po) => {
      if (po.status !== "draft" && po.status !== "approved") return false;
      if (!po.requestedDeliveryDate) return false;

      // Calculate hours until we must send
      const deliveryDate = new Date(po.requestedDeliveryDate);
      const hoursUntilDelivery = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // If delivery is within 72 hours, it's urgent to send now
      return hoursUntilDelivery <= 72;
    });

    const urgentItems: WorkItem[] = [];
    if (urgentPOs.length > 0) {
      // Group by supplier for the label
      const suppliers = new Set(urgentPOs.map((po) => po.supplierName));
      urgentItems.push({
        id: "urgent-pos",
        label: `${urgentPOs.length} PO${urgentPOs.length !== 1 ? "s" : ""} to send (${Array.from(suppliers).slice(0, 2).join(", ")}${suppliers.size > 2 ? ` +${suppliers.size - 2}` : ""} cut-offs)`,
        count: urgentPOs.length,
        href: "/pos?status=draft",
      });
    }

    if (urgentItems.length > 0) {
      groups.push({
        id: "before-cutoff",
        label: "Before Cut-off",
        icon: <Clock size={14} className="text-stark-orange" />,
        items: urgentItems,
        variant: "urgent",
      });
    }

    // === TODAY (by end of day) ===
    const todayItems: WorkItem[] = [];

    // Invoice matches to review (discrepancies block payment)
    const invoicesToReview = (allInvoices || []).filter(
      (inv) => inv.status === "discrepancy" || inv.status === "pending_match"
    ).length;

    if (invoicesToReview > 0) {
      todayItems.push({
        id: "invoices-review",
        label: `${invoicesToReview} invoice match${invoicesToReview !== 1 ? "es" : ""} to review`,
        count: invoicesToReview,
        href: "/invoices?status=discrepancy",
      });
    }

    // Pending approvals (blocking others)
    const pendingApprovals = (allApprovals || []).filter(
      (a) => a.status === "pending"
    ).length;

    if (pendingApprovals > 0) {
      todayItems.push({
        id: "approvals",
        label: `${pendingApprovals} approval${pendingApprovals !== 1 ? "s" : ""} pending your signature`,
        count: pendingApprovals,
        href: "/approvals",
      });
    }

    if (todayItems.length > 0) {
      groups.push({
        id: "today",
        label: "Before 14:00",
        icon: <CalendarClock size={14} className="text-amber-600" />,
        items: todayItems,
        variant: "today",
      });
    }

    // === FLEXIBLE (today, no hard deadline) ===
    const flexibleItems: WorkItem[] = [];

    // PRs to review for tomorrow's cut-offs
    const prsToReview = (allPRs || []).filter(
      (pr) => pr.status === "pending"
    ).length;

    if (prsToReview > 0) {
      flexibleItems.push({
        id: "prs-review",
        label: `${prsToReview} PR${prsToReview !== 1 ? "s" : ""} to review for tomorrow's cut-offs`,
        count: prsToReview,
        href: "/prs?status=pending",
      });
    }

    // POs to prepare (not urgent yet)
    const posToPrep = (allPOs || []).filter((po) => {
      if (po.status !== "draft") return false;
      if (!po.requestedDeliveryDate) return true;

      const deliveryDate = new Date(po.requestedDeliveryDate);
      const hoursUntilDelivery = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDelivery > 72;
    }).length;

    if (posToPrep > 0) {
      flexibleItems.push({
        id: "pos-prep",
        label: `${posToPrep} PO${posToPrep !== 1 ? "s" : ""} to prepare`,
        count: posToPrep,
        href: "/pos?status=draft",
      });
    }

    if (flexibleItems.length > 0) {
      groups.push({
        id: "flexible",
        label: "Today (flexible)",
        icon: <Calendar size={14} className="text-gray-500" />,
        items: flexibleItems,
        variant: "flexible",
      });
    }

    return groups;
  }, [allPRs, allPOs, allInvoices, allApprovals]);

  const totalItems = timeGroups.reduce(
    (sum, group) => sum + group.items.reduce((s, i) => s + i.count, 0),
    0
  );

  if (totalItems === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Queue Today</CardTitle>
        </CardHeader>
        <div className="px-5 py-6 text-center text-gray-400 text-sm">
          All clear! No items in your queue.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Queue Today</CardTitle>
        {totalItems > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            {totalItems}
          </span>
        )}
      </CardHeader>
      <div className="divide-y divide-gray-100">
        {timeGroups.map((group) => (
          <TimeGroupSection key={group.id} group={group} />
        ))}
      </div>
    </Card>
  );
}

function TimeGroupSection({ group }: { group: TimeGroup }) {
  const borderColor = {
    urgent: "border-l-stark-orange",
    today: "border-l-amber-400",
    flexible: "border-l-gray-300",
  }[group.variant];

  const bgColor = {
    urgent: "bg-stark-orange-10/50",
    today: "bg-amber-50/50",
    flexible: "bg-gray-50/50",
  }[group.variant];

  return (
    <div className={`border-l-2 ${borderColor}`}>
      <div className={`px-4 py-2 flex items-center gap-2 ${bgColor}`}>
        {group.icon}
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          {group.label}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {group.items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">{item.label}</span>
            <ChevronRight size={14} className="text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
