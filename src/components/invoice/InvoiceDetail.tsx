"use client";

import Link from "next/link";
import { useInvoice, usePurchaseOrders, approveInvoice } from "@/hooks";
import { Button, StatusBadge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import type { InvoiceStatus, MatchResult, InvoiceLineItem } from "@/lib/db";

interface InvoiceDetailProps {
  invoiceId: string;
}

export function InvoiceDetail({ invoiceId }: InvoiceDetailProps) {
  const invoice = useInvoice(invoiceId);
  const allPOs = usePurchaseOrders();

  const linkedPOs = allPOs?.filter((po) => invoice?.poIds.includes(po.id)) ?? [];

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const getStatusVariant = (status: InvoiceStatus) => {
    const map: Record<InvoiceStatus, "success" | "warning" | "error" | "info" | "primary"> = {
      received: "info",
      pending_match: "warning",
      matched: "success",
      discrepancy: "error",
      approved: "success",
      paid: "primary",
      rejected: "error",
    };
    return map[status] ?? "info";
  };

  const getMatchResultVariant = (result?: MatchResult) => {
    if (!result) return "info";
    const map: Record<MatchResult, "success" | "warning" | "error" | "info"> = {
      full_match: "success",
      quantity_mismatch: "warning",
      price_mismatch: "error",
      missing_po: "error",
      partial_match: "warning",
    };
    return map[result] ?? "info";
  };

  const getMatchResultLabel = (result?: MatchResult) => {
    if (!result) return "Not Matched";
    const map: Record<MatchResult, string> = {
      full_match: "Full Match",
      quantity_mismatch: "Quantity Mismatch",
      price_mismatch: "Price Mismatch",
      missing_po: "Missing PO",
      partial_match: "Partial Match",
    };
    return map[result] ?? result;
  };

  const getLineMatchIcon = (matchStatus?: MatchResult) => {
    if (!matchStatus) return null;
    if (matchStatus === "full_match") {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-stark-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  };

  const handleApprove = async () => {
    if (invoice) {
      await approveInvoice(invoice.id, "current-user");
    }
  };

  if (!invoice) {
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
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-stark-navy">{invoice.invoiceNumber}</h2>
                <StatusBadge
                  status={invoice.status.replace(/_/g, " ")}
                  variant={getStatusVariant(invoice.status)}
                />
              </div>
              <p className="text-gray-500">
                Supplier Reference: {invoice.supplierInvoiceRef}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-stark-navy">
                {formatCurrency(invoice.total, invoice.currency)}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-gray-500 uppercase">Supplier</div>
              <div className="font-medium">{invoice.supplierName}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Invoice Date</div>
              <div className="font-medium">{formatDate(invoice.invoiceDate)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Due Date</div>
              <div className="font-medium">{formatDate(invoice.dueDate)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Received</div>
              <div className="font-medium">{formatDate(invoice.receivedDate)}</div>
            </div>
          </div>
        </div>

        {/* Match Result */}
        <Card>
          <CardHeader>
            <CardTitle>Match Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge
                    status={getMatchResultLabel(invoice.matchResult)}
                    variant={getMatchResultVariant(invoice.matchResult)}
                  />
                  {invoice.matchScore !== undefined && (
                    <span className="text-sm text-gray-500">
                      Score: {Math.round(invoice.matchScore * 100)}%
                    </span>
                  )}
                </div>
                {invoice.discrepancyAmount && (
                  <div className="text-sm text-stark-orange">
                    Discrepancy: {formatCurrency(invoice.discrepancyAmount, invoice.currency)}
                  </div>
                )}
                {invoice.discrepancyNotes && (
                  <p className="text-sm text-gray-600 mt-2">{invoice.discrepancyNotes}</p>
                )}
              </div>
              {linkedPOs.length > 0 && (
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase mb-1">Linked POs</div>
                  <div className="space-y-1">
                    {linkedPOs.map((po) => (
                      <Link
                        key={po.id}
                        href={`/pos/${po.id}`}
                        className="block text-sm font-medium text-stark-navy hover:underline"
                      >
                        {po.poNumber}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items ({invoice.lineItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.lineItems.map((item: InvoiceLineItem) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{item.productName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.sku}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatCurrency(item.unitPrice, item.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(item.totalPrice, item.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getLineMatchIcon(item.matchStatus)}
                        {item.variance !== undefined && item.variance !== 0 && (
                          <span className={`text-xs ${item.variance > 0 ? "text-stark-orange" : "text-green-700"}`}>
                            {item.variance > 0 ? "+" : ""}{formatCurrency(item.variance, item.currency)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">
                    Subtotal:
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(invoice.subtotal, invoice.currency)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-medium text-right">
                    Tax:
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(invoice.tax, invoice.currency)}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-right">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice.status === "matched" && (
              <Button onClick={handleApprove} className="w-full">
                Approve Invoice
              </Button>
            )}
            {invoice.status === "discrepancy" && (
              <>
                <Button variant="outline" className="w-full">
                  Review Discrepancy
                </Button>
                <Button variant="outline" className="w-full">
                  Request Credit Note
                </Button>
              </>
            )}
            <Button variant="outline" className="w-full">
              Download PDF
            </Button>
            <Button variant="ghost" className="w-full">
              View History
            </Button>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <div className="text-sm font-medium">Received</div>
                  <div className="text-xs text-gray-500">{formatDate(invoice.receivedDate)}</div>
                </div>
              </div>
              {invoice.matchResult && (
                <div className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    invoice.matchResult === "full_match" ? "bg-green-500" : "bg-stark-orange"
                  }`} />
                  <div>
                    <div className="text-sm font-medium">
                      {getMatchResultLabel(invoice.matchResult)}
                    </div>
                    <div className="text-xs text-gray-500">Automatic matching</div>
                  </div>
                </div>
              )}
              {invoice.approvedAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                  <div>
                    <div className="text-sm font-medium">Approved</div>
                    <div className="text-xs text-gray-500">{formatDate(invoice.approvedAt)}</div>
                  </div>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-stark-navy mt-2" />
                  <div>
                    <div className="text-sm font-medium">Paid</div>
                    <div className="text-xs text-gray-500">{formatDate(invoice.paidAt)}</div>
                    {invoice.paymentReference && (
                      <div className="text-xs text-gray-400">Ref: {invoice.paymentReference}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Linked Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Linked Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {linkedPOs.length > 0 ? (
              linkedPOs.map((po) => (
                <Link
                  key={po.id}
                  href={`/pos/${po.id}`}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                >
                  <div>
                    <div className="text-sm font-medium text-stark-navy">{po.poNumber}</div>
                    <div className="text-xs text-gray-500">{po.supplierName}</div>
                  </div>
                  <StatusBadge status={po.status} variant="info" />
                </Link>
              ))
            ) : (
              <div className="text-sm text-gray-500">No linked POs</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
