"use client";

import { usePurchaseOrder } from "@/hooks";
import { StatusBadge } from "@/components/ui";
import type { POStatus } from "@/lib/db";

interface POTimelineProps {
  poId: string;
}

interface TimelineStep {
  label: string;
  description: string;
  date?: Date;
  completed: boolean;
  pending?: boolean;
}

export function POTimeline({ poId }: POTimelineProps) {
  const po = usePurchaseOrder(poId);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Pending";
    return new Date(date).toLocaleDateString("en-GB", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  };

  const getStatusLabel = (status: POStatus): string => {
    const map: Record<POStatus, string> = {
      draft: "Draft", pending_approval: "Pending", approved: "Approved",
      sent: "Sent", confirmed: "Confirmed", partially_received: "Partial",
      received: "Received", completed: "Completed", cancelled: "Cancelled",
    };
    return map[status] || status;
  };

  if (!po) {
    return <div className="bg-white rounded-lg border p-8 text-center text-gray-400">Loading...</div>;
  }

  const steps: TimelineStep[] = [
    { label: "PO Created", description: `Created from ${po.prIds.length} bundled PRs`, date: po.createdAt, completed: true },
    { label: "Sent to Supplier", description: po.sentVia ? `Transmitted via ${po.sentVia.toUpperCase()} to ${po.supplierName}` : "Awaiting send", date: po.sentAt, completed: !!po.sentAt },
    { label: "Supplier Confirmation", description: po.supplierOrderNumber ? `Order #${po.supplierOrderNumber}` : "Awaiting ORDRSP from supplier", date: po.confirmedAt, completed: !!po.confirmedAt, pending: po.status === "sent" },
    { label: "Goods Received", description: po.completedAt ? "All items received" : `ETA: ${formatDate(po.requestedDeliveryDate)}`, date: po.completedAt, completed: po.status === "received" || po.status === "completed", pending: po.status === "confirmed" },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-xl font-bold text-gray-900">{po.poNumber}</h3>
        <StatusBadge status={getStatusLabel(po.status)} variant="primary" />
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                step.completed ? "bg-green-500" : step.pending ? "bg-stark-navy" : "bg-gray-300"
              }`}>
                {step.completed ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-xs ${step.pending ? "text-white" : "text-gray-600"}`}>{idx + 1}</span>
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${step.completed ? "text-gray-900" : step.pending ? "text-gray-700" : "text-gray-400"}`}>
                    {step.label}
                  </span>
                  <span className={`text-sm ${step.completed ? "text-gray-500" : "text-gray-400"}`}>
                    {step.date ? formatDate(step.date) : step.pending ? "Pending" : "—"}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${step.completed ? "text-gray-500" : "text-gray-400"}`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
