/**
 * My Workload Component
 *
 * Personal work queue showing:
 * - PRs to Review
 * - POs to Send
 * - Invoices to Match
 */

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FileText, Send, Receipt, ChevronRight } from "lucide-react";
import { usePurchaseRequests, usePurchaseOrders, useInvoices } from "@/hooks";
import { Card, CardHeader, CardTitle } from "@/components/ui";

interface WorkloadItem {
  label: string;
  count: number;
  href: string;
  icon: React.ReactNode;
}

export function MyWorkload() {
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const workloadItems = useMemo(() => {
    // PRs pending review (status: pending)
    const prsToReview = (allPRs || []).filter(
      (pr) => pr.status === "pending"
    ).length;

    // POs in draft (need to send)
    const posToSend = (allPOs || []).filter(
      (po) => po.status === "draft" || po.status === "approved"
    ).length;

    // Invoices pending match
    const invoicesToMatch = (allInvoices || []).filter(
      (inv) => inv.status === "pending_match" || inv.status === "received"
    ).length;

    const items: WorkloadItem[] = [
      {
        label: "PRs to Review",
        count: prsToReview,
        href: "/prs?status=pending",
        icon: <FileText size={18} />,
      },
      {
        label: "POs to Send",
        count: posToSend,
        href: "/pos?status=draft",
        icon: <Send size={18} />,
      },
      {
        label: "Invoices to Match",
        count: invoicesToMatch,
        href: "/invoices?status=pending_match",
        icon: <Receipt size={18} />,
      },
    ];

    return items;
  }, [allPRs, allPOs, allInvoices]);

  const totalItems = workloadItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Workload</CardTitle>
        {totalItems > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            {totalItems}
          </span>
        )}
      </CardHeader>
      <div className="divide-y divide-gray-100">
        {workloadItems.map((item) => (
          <WorkloadRow key={item.label} item={item} />
        ))}
      </div>
    </Card>
  );
}

function WorkloadRow({ item }: { item: WorkloadItem }) {
  const hasItems = item.count > 0;

  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between px-5 py-3 transition-colors ${
        hasItems ? "hover:bg-gray-50" : "opacity-50 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
          {item.icon}
        </div>
        <span className="text-sm text-gray-700">{item.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-lg font-semibold ${
            hasItems ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {item.count}
        </span>
        {hasItems && <ChevronRight size={16} className="text-gray-400" />}
      </div>
    </Link>
  );
}
