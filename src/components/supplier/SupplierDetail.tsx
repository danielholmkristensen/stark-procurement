"use client";

import Link from "next/link";
import { useSupplier, usePurchaseOrders, useInvoices } from "@/hooks";
import { Button, StatusBadge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import type { POStatus } from "@/lib/db";

interface SupplierDetailProps {
  supplierId: string;
}

export function SupplierDetail({ supplierId }: SupplierDetailProps) {
  const supplier = useSupplier(supplierId);
  const allPOs = usePurchaseOrders();
  const allInvoices = useInvoices();

  const supplierPOs = allPOs?.filter((po) => po.supplierId === supplierId) ?? [];
  const supplierInvoices = allInvoices?.filter((inv) => inv.supplierId === supplierId) ?? [];

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusVariant = (status: POStatus) => {
    const map: Record<POStatus, "success" | "warning" | "error" | "info" | "primary"> = {
      draft: "info",
      pending_approval: "warning",
      approved: "info",
      sent: "primary",
      confirmed: "success",
      partially_received: "warning",
      received: "success",
      completed: "success",
      cancelled: "error",
    };
    return map[status] ?? "info";
  };

  // Calculate totals
  const totalPOValue = supplierPOs.reduce((sum, po) => sum + po.total, 0);
  const totalInvoiceValue = supplierInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const activePOs = supplierPOs.filter(
    (po) => !["completed", "cancelled"].includes(po.status)
  ).length;

  if (!supplier) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-3 h-3 rounded-full ${
                  supplier.isActive ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <div>
                <h2 className="text-xl font-bold text-stark-navy">{supplier.name}</h2>
                {supplier.legalName && supplier.legalName !== supplier.name && (
                  <p className="text-sm text-gray-500">{supplier.legalName}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">{supplier.supplierNumber}</p>
              </div>
            </div>
            <StatusBadge
              status={supplier.isActive ? "Active" : "Inactive"}
              variant={supplier.isActive ? "success" : "warning"}
            />
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-gray-500 uppercase">Contact Email</div>
              <a
                href={`mailto:${supplier.email}`}
                className="text-sm font-medium text-stark-navy hover:underline"
              >
                {supplier.email}
              </a>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Phone</div>
              <div className="text-sm font-medium">{supplier.phone ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Website</div>
              {supplier.website ? (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-stark-navy hover:underline"
                >
                  {supplier.website.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs text-gray-500 uppercase mb-1">Address</div>
            <div className="text-sm">
              {supplier.address}
              <br />
              {supplier.postalCode} {supplier.city}
              <br />
              {supplier.country}
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle>Capabilities & Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">EDI Support</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      supplier.supportsEDI
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {supplier.supportsEDI ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Packet Labeling</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                      supplier.supportsPacketLabeling
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {supplier.supportsPacketLabeling ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Preferred Channel</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-stark-navy-10 text-stark-navy">
                    {supplier.preferredCommunication.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Payment Terms</span>
                  <span className="text-sm font-medium">{supplier.paymentTerms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Currency</span>
                  <span className="text-sm font-medium">{supplier.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Tax ID</span>
                  <span className="text-sm font-medium">{supplier.taxId ?? "—"}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Avg Lead Time</span>
                  <span className="text-sm font-medium">{supplier.averageLeadTimeDays} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">On-Time Delivery</span>
                  <span
                    className={`text-sm font-medium ${
                      supplier.onTimeDeliveryRate >= 0.9
                        ? "text-green-700"
                        : "text-stark-orange"
                    }`}
                  >
                    {Math.round(supplier.onTimeDeliveryRate * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Quality Score</span>
                  <span
                    className={`text-sm font-medium ${
                      supplier.qualityScore >= 0.9
                        ? "text-green-700"
                        : "text-stark-orange"
                    }`}
                  >
                    {Math.round(supplier.qualityScore * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-gray-500 uppercase mb-2">Categories</div>
              <div className="flex flex-wrap gap-2">
                {supplier.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent POs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Purchase Orders</CardTitle>
              <Link href={`/pos?supplier=${supplierId}`}>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    PO #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supplierPOs.slice(0, 5).map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/pos/${po.id}`}
                        className="font-medium text-stark-navy hover:underline"
                      >
                        {po.poNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(po.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(po.total, po.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={po.status.replace(/_/g, " ")}
                        variant={getStatusVariant(po.status)}
                      />
                    </td>
                  </tr>
                ))}
                {supplierPOs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No purchase orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total POs</span>
              <span className="text-lg font-bold text-stark-navy">{supplierPOs.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Active POs</span>
              <span className="text-lg font-bold text-stark-navy">{activePOs}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total PO Value</span>
              <span className="text-lg font-bold text-stark-navy">
                {formatCurrency(totalPOValue, supplier.currency)}
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Invoices</span>
                <span className="text-lg font-bold text-stark-navy">{supplierInvoices.length}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">Invoice Value</span>
                <span className="text-lg font-bold text-stark-navy">
                  {formatCurrency(totalInvoiceValue, supplier.currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full">Create PO</Button>
            <Button variant="outline" className="w-full">
              Send Message
            </Button>
            <Button variant="outline" className="w-full">
              View Contracts
            </Button>
            <Button variant="ghost" className="w-full">
              Edit Supplier
            </Button>
          </CardContent>
        </Card>

        {/* Performance Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-center justify-center bg-gray-50 rounded-lg text-sm text-gray-400">
              Performance chart placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
