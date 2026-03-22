"use client";

import { usePurchaseOrder, usePurchaseRequests } from "@/hooks";
import { Button, StatusBadge, Badge } from "@/components/ui";
import type { POStatus } from "@/lib/db";

interface PODetailProps {
  poId: string;
}

export function PODetail({ poId }: PODetailProps) {
  const po = usePurchaseOrder(poId);
  const allPRs = usePurchaseRequests();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", minimumFractionDigits: 2 }).format(value);

  const formatDate = (date: Date | undefined, format: "short" | "long" = "short") => {
    if (!date) return "—";
    const d = new Date(date);
    return format === "long"
      ? d.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
      : d.toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
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

  if (!po) {
    return <div className="bg-white rounded-lg border p-8 text-center text-gray-400">Loading...</div>;
  }

  const linkedPRs = allPRs?.filter((pr) => po.prIds.includes(pr.id)) || [];

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{po.poNumber}</h3>
              <p className="text-gray-500">{po.supplierName} • Created {formatDate(po.createdAt, "long")}</p>
            </div>
            <StatusBadge status={getStatusLabel(po.status)} variant={getStatusVariant(po.status)} />
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500 block">Total Value</span><p className="font-bold text-lg">{formatCurrency(po.total)}</p></div>
            <div><span className="text-gray-500 block">Items</span><p className="font-medium">{po.lineItems.length}</p></div>
            <div><span className="text-gray-500 block">PRs Bundled</span><p className="font-medium">{po.prIds.length}</p></div>
            <div><span className="text-gray-500 block">Delivery Date</span><p className="font-medium">{formatDate(po.requestedDeliveryDate)}</p></div>
          </div>
        </div>

        {/* Packet Specifications */}
        {po.prIds.length > 1 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <h4 className="font-semibold text-gray-900">Packet Specifications</h4>
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded">Critical for Receiving</span>
            </div>
            <div className="divide-y divide-gray-100">
              {linkedPRs.map((pr, idx) => (
                <div key={pr.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">Packet {idx + 1} — {pr.prNumber}</span>
                    <span className="text-sm text-gray-500">{pr.branchName}</span>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-sm flex gap-4 flex-wrap">
                    {pr.lineItems.slice(0, 3).map((item) => (
                      <span key={item.id}>{item.sku} × {item.quantity}</span>
                    ))}
                    {pr.lineItems.length > 3 && <span className="text-gray-400">+{pr.lineItems.length - 3} more</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">All Line Items ({po.lineItems.length})</h4>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {po.lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm font-medium">{item.sku}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.productName}</td>
                  <td className="px-4 py-3 text-sm">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">Total</td>
                <td className="px-4 py-3 text-sm font-bold">{formatCurrency(po.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Actions</h4>
          <div className="space-y-2">
            <Button className="w-full">Edit PO</Button>
            <Button variant="outline" className="w-full">Download PDF</Button>
            <Button variant="ghost" className="w-full">Cancel PO</Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Supplier Info</h4>
          <p className="font-medium">{po.supplierName}</p>
          {po.supplierEmail && <p className="text-sm text-gray-500">{po.supplierEmail}</p>}
          <div className="flex gap-2 mt-3">
            {po.sentVia === "edi" && <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">EDI</span>}
            {po.sentVia === "email" && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Email</span>}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Timeline</h4>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-400 w-24">{formatDate(po.createdAt)}</span>
              <span>PO Created</span>
            </div>
            {po.sentAt && (
              <div className="flex gap-2">
                <span className="text-gray-400 w-24">{formatDate(po.sentAt)}</span>
                <span>Sent via {po.sentVia}</span>
              </div>
            )}
            {po.confirmedAt && (
              <div className="flex gap-2 text-green-600">
                <span className="text-gray-400 w-24">{formatDate(po.confirmedAt)}</span>
                <span>Confirmed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
