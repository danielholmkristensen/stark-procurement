"use client";

import Link from "next/link";
import { useInvoices, usePurchaseOrders } from "@/hooks";
import { StatusBadge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import type { MatchResult } from "@/lib/db";

export function InvoiceMatchResults() {
  const allInvoices = useInvoices();
  const allPOs = usePurchaseOrders();

  const poMap = new Map(allPOs?.map((po) => [po.id, po]) ?? []);

  // Group invoices by match result
  const matchedInvoices = allInvoices?.filter((i) => i.matchResult) ?? [];

  const getMatchResultLabel = (result: MatchResult) => {
    const map: Record<MatchResult, string> = {
      full_match: "Full Match",
      quantity_mismatch: "Quantity Mismatch",
      price_mismatch: "Price Mismatch",
      missing_po: "Missing PO",
      partial_match: "Partial Match",
    };
    return map[result] ?? result;
  };

  const getMatchResultVariant = (result: MatchResult) => {
    const map: Record<MatchResult, "success" | "warning" | "error" | "info"> = {
      full_match: "success",
      quantity_mismatch: "warning",
      price_mismatch: "error",
      missing_po: "error",
      partial_match: "warning",
    };
    return map[result] ?? "info";
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  // Stats
  const stats = {
    total: matchedInvoices.length,
    fullMatch: matchedInvoices.filter((i) => i.matchResult === "full_match").length,
    discrepancies: matchedInvoices.filter(
      (i) => i.matchResult && i.matchResult !== "full_match"
    ).length,
    avgScore: matchedInvoices.length > 0
      ? matchedInvoices.reduce((sum, i) => sum + (i.matchScore ?? 0), 0) / matchedInvoices.length
      : 0,
  };

  // Recent matches
  const recentMatches = [...matchedInvoices]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Total Matched</div>
            <div className="text-3xl font-bold text-stark-navy">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Full Matches</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
              <span className="text-3xl font-bold text-stark-navy">{stats.fullMatch}</span>
            </div>
            <div className="text-xs text-gray-400">
              {stats.total > 0 ? Math.round((stats.fullMatch / stats.total) * 100) : 0}% of total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Discrepancies</div>
            <div className="text-3xl font-bold text-stark-navy">{stats.discrepancies}</div>
            <div className="text-xs text-gray-400">
              {stats.total > 0 ? Math.round((stats.discrepancies / stats.total) * 100) : 0}% of total
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500">Avg Match Score</div>
            <div className="text-3xl font-bold text-stark-navy">
              {Math.round(stats.avgScore * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Match Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Match Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(["full_match", "quantity_mismatch", "price_mismatch", "missing_po", "partial_match"] as MatchResult[]).map(
              (result) => {
                const count = matchedInvoices.filter((i) => i.matchResult === result).length;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                return (
                  <div key={result} className="flex items-center gap-4">
                    <div className="w-32">
                      <StatusBadge
                        status={getMatchResultLabel(result)}
                        variant={getMatchResultVariant(result)}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            result === "full_match"
                              ? "bg-green-500"
                              : "bg-stark-orange"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right">
                      <span className="font-medium">{count}</span>
                      <span className="text-gray-400 text-sm ml-1">({Math.round(percentage)}%)</span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Match Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  PO
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Result
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentMatches.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium text-stark-navy hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <div className="text-xs text-gray-500">{formatDate(invoice.invoiceDate)}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{invoice.supplierName}</td>
                  <td className="px-4 py-3 text-sm">
                    {invoice.poIds.length > 0 ? (
                      invoice.poIds.map((poId, idx) => {
                        const po = poMap.get(poId);
                        return (
                          <span key={poId}>
                            {idx > 0 && ", "}
                            <Link
                              href={`/pos/${poId}`}
                              className="text-stark-navy hover:underline"
                            >
                              {po?.poNumber ?? poId.slice(0, 8)}
                            </Link>
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {invoice.matchResult && (
                      <StatusBadge
                        status={getMatchResultLabel(invoice.matchResult)}
                        variant={getMatchResultVariant(invoice.matchResult)}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {invoice.matchScore !== undefined ? (
                      <span className="flex items-center justify-end gap-1.5">
                        {invoice.matchScore >= 0.9 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        )}
                        <span className="font-medium text-stark-navy">
                          {Math.round(invoice.matchScore * 100)}%
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {recentMatches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No match results yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
