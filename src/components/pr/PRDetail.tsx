"use client";

/**
 * PR Detail Component (Screen A2)
 *
 * Shows full PR information including header, line items,
 * actions sidebar, linked PO, and suggested suppliers.
 */

import { usePurchaseRequest, updatePurchaseRequest } from "@/hooks";
import { Badge, SourceBadge, StatusBadge, Button, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import type { PRStatus, PurchaseRequest } from "@/lib/db";

interface PRDetailProps {
  prId: string;
}

export function PRDetail({ prId }: PRDetailProps) {
  const pr = usePurchaseRequest(prId);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format date
  const formatDate = (date: Date | undefined, format: "short" | "long" = "short") => {
    if (!date) return "—";
    const d = new Date(date);
    if (format === "long") {
      return d.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return d.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  // Handle mark as reviewed
  const handleMarkAsReviewed = async () => {
    if (!pr) return;
    await updatePurchaseRequest(prId, { status: "approved" });
  };

  // Handle add to bundle (placeholder)
  const handleAddToBundle = () => {
    alert("Add to Bundle functionality coming in PO Module (Iteration 01.3)");
  };

  // Handle create PO (placeholder)
  const handleCreatePO = () => {
    alert("Create PO from PR functionality coming in PO Module (Iteration 01.3)");
  };

  if (!pr) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-pulse text-gray-400">Loading purchase request...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="col-span-2 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{pr.prNumber}</h3>
              <p className="text-gray-500">Created {formatDate(pr.createdAt, "long")}</p>
            </div>
            <div className="flex gap-2">
              <SourceBadge source={pr.source} />
              <StatusBadge
                status={getStatusLabel(pr.status)}
                variant={getStatusVariant(pr.status)}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Location</span>
              <p className="font-medium">{pr.branchName}</p>
            </div>
            <div>
              <span className="text-gray-500 block">Need Date</span>
              <p className="font-medium">{formatDate(pr.requestedDeliveryDate)}</p>
            </div>
            <div>
              <span className="text-gray-500 block">Items</span>
              <p className="font-medium">{pr.lineItems.length}</p>
            </div>
            <div>
              <span className="text-gray-500 block">Total Value</span>
              <p className="font-medium text-lg">{formatCurrency(pr.totalEstimatedValue)}</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-900">Line Items</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pr.lineItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm font-medium">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.productName}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(item.estimatedPrice)}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(item.quantity * item.estimatedPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold">
                    {formatCurrency(pr.totalEstimatedValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Additional Info */}
        {(pr.notes || pr.externalReference) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Additional Information</h4>
            <div className="space-y-4 text-sm">
              {pr.notes && (
                <div>
                  <span className="text-gray-500 block mb-1">Notes</span>
                  <p className="text-gray-900">{pr.notes}</p>
                </div>
              )}
              {pr.externalReference && (
                <div>
                  <span className="text-gray-500 block mb-1">External Reference</span>
                  <p className="text-gray-900">{pr.externalReference}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Actions</h4>
          <div className="space-y-2">
            <Button onClick={handleAddToBundle} className="w-full">
              Add to Bundle
            </Button>
            <Button onClick={handleCreatePO} variant="outline" className="w-full">
              Create PO from PR
            </Button>
            {pr.status === "pending" && (
              <Button onClick={handleMarkAsReviewed} variant="ghost" className="w-full">
                Mark as Reviewed
              </Button>
            )}
          </div>
        </div>

        {/* Linked PO */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Linked PO</h4>
          {pr.status === "converted" ? (
            <div className="p-3 bg-green-50 rounded border border-green-100">
              <p className="text-sm text-green-700 font-medium">PO Created</p>
              <p className="text-xs text-green-600 mt-1">
                Converted on {formatDate(pr.convertedAt)}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No PO linked yet</p>
          )}
        </div>

        {/* Suggested Suppliers */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Suggested Suppliers</h4>
          <div className="space-y-2">
            {pr.suggestedSupplierName ? (
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium">{pr.suggestedSupplierName}</span>
                <span className="text-xs text-green-600">Suggested</span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No suppliers suggested</p>
            )}
          </div>
        </div>

        {/* Requester Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Requester</h4>
          <div className="text-sm">
            <p className="font-medium">{pr.requesterName}</p>
            {pr.requesterEmail && (
              <p className="text-gray-500">{pr.requesterEmail}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
