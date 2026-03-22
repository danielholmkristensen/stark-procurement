"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePurchaseOrders, useSuppliers } from "@/hooks";
import { SearchInput, Select, StatusBadge, Button } from "@/components/ui";
import type { POStatus } from "@/lib/db";

const PAGE_SIZE = 20;

export function POList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "all">("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [currentPage, setCurrentPage] = useState(1);

  const allPOs = usePurchaseOrders();
  const allSuppliers = useSuppliers();

  const filteredPOs = useMemo(() => {
    if (!allPOs) return [];
    return allPOs.filter((po) => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (!po.poNumber.toLowerCase().includes(searchLower) &&
            !po.supplierName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      if (statusFilter !== "all" && po.status !== statusFilter) return false;
      if (supplierFilter !== "all" && po.supplierId !== supplierFilter) return false;
      return true;
    });
  }, [allPOs, search, statusFilter, supplierFilter]);

  const paginatedPOs = filteredPOs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.ceil(filteredPOs.length / PAGE_SIZE);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", minimumFractionDigits: 0 }).format(value);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
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

  const getEscalationBorder = (level: string) => {
    if (level === "attention" || level === "action" || level === "urgent") {
      return "border-l-4 border-stark-orange";
    }
    return "";
  };

  if (!allPOs) {
    return <div className="bg-white rounded-lg border p-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search POs..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as POStatus | "all")}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="confirmed">Confirmed</option>
            <option value="received">Received</option>
          </Select>
          <Select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
            <option value="all">All Suppliers</option>
            {allSuppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "list" ? "primary" : "outline"} size="sm" onClick={() => setViewMode("list")}>List</Button>
          <Link href="/pos/kanban"><Button variant={viewMode === "kanban" ? "primary" : "outline"} size="sm">Kanban</Button></Link>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PO Number</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PRs</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedPOs.length === 0 ? (
            <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No purchase orders found</td></tr>
          ) : paginatedPOs.map((po) => (
            <tr key={po.id} className={`hover:bg-gray-50 ${getEscalationBorder(po.escalationLevel)}`}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{po.poNumber}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{po.supplierName}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{po.prIds.length}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{po.lineItems.length}</td>
              <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatCurrency(po.total)}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{formatDate(po.requestedDeliveryDate)}</td>
              <td className="px-4 py-3"><StatusBadge status={getStatusLabel(po.status)} variant={getStatusVariant(po.status)} /></td>
              <td className="px-4 py-3 text-sm">
                {po.status === "draft" ? (
                  <Button size="sm" className="text-xs">Send Now</Button>
                ) : (
                  <Link href={`/pos/${po.id}`} className="text-stark-navy font-medium hover:text-stark-orange">View</Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-500">Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredPOs.length)}-{Math.min(currentPage * PAGE_SIZE, filteredPOs.length)} of {filteredPOs.length}</span>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
