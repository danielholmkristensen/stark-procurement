"use client";

import { useState } from "react";
import Link from "next/link";
import { useSuppliers, usePurchaseOrders } from "@/hooks";
import { Button, SearchInput, Select, StatusBadge } from "@/components/ui";

interface SupplierListProps {
  showActiveOnly?: boolean;
}

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "Building Materials", label: "Building Materials" },
  { value: "Electrical", label: "Electrical" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "Tools", label: "Tools" },
  { value: "Timber", label: "Timber" },
  { value: "HVAC", label: "HVAC" },
];

const statusOptions = [
  { value: "all", label: "All Suppliers" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
];

export function SupplierList({ showActiveOnly = false }: SupplierListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    showActiveOnly ? "active" : "all"
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const allSuppliers = useSuppliers();
  const allPOs = usePurchaseOrders();

  // Calculate PO counts per supplier
  const poCountBySupplier = new Map<string, number>();
  allPOs?.forEach((po) => {
    const current = poCountBySupplier.get(po.supplierId) ?? 0;
    poCountBySupplier.set(po.supplierId, current + 1);
  });

  // Filter suppliers
  const filteredSuppliers = (allSuppliers ?? []).filter((supplier) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.supplierNumber.toLowerCase().includes(searchLower) ||
        supplier.email.toLowerCase().includes(searchLower) ||
        supplier.city.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (category !== "all" && !supplier.categories.includes(category)) return false;

    // Status filter
    if (statusFilter === "active" && !supplier.isActive) return false;
    if (statusFilter === "inactive" && supplier.isActive) return false;

    return true;
  });

  // Sort by name
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Pagination
  const totalPages = Math.ceil(sortedSuppliers.length / pageSize);
  const paginatedSuppliers = sortedSuppliers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const getCommunicationBadge = (method: string) => {
    // STARK Design: All communication methods use navy variants - no blue/purple
    const colors: Record<string, string> = {
      email: "bg-stark-navy-10 text-stark-navy",
      edi: "bg-stark-navy-10 text-stark-navy",
      portal: "bg-stark-navy-10 text-stark-navy",
    };
    return colors[method] ?? "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers..."
            />
          </div>
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-44"
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "all" | "active" | "inactive");
              setPage(1);
            }}
            className="w-36"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Suppliers</div>
          <div className="text-2xl font-bold text-stark-navy">{allSuppliers?.length ?? 0}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-2xl font-bold text-green-600">
            {allSuppliers?.filter((s) => s.isActive).length ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">EDI Enabled</div>
          <div className="text-2xl font-bold text-stark-navy">
            {allSuppliers?.filter((s) => s.supportsEDI).length ?? 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Packet Label Support</div>
          <div className="text-2xl font-bold text-stark-navy">
            {allSuppliers?.filter((s) => s.supportsPacketLabeling).length ?? 0}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Categories
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Communication
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                POs
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Performance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        supplier.isActive ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <Link
                        href={`/suppliers/${supplier.id}`}
                        className="font-medium text-stark-navy hover:underline"
                      >
                        {supplier.name}
                      </Link>
                      <div className="text-xs text-gray-500">{supplier.supplierNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  <div>{supplier.city}</div>
                  <div className="text-xs">{supplier.country}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {supplier.categories.slice(0, 2).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                    {supplier.categories.length > 2 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                        +{supplier.categories.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${getCommunicationBadge(
                        supplier.preferredCommunication
                      )}`}
                    >
                      {supplier.preferredCommunication.toUpperCase()}
                    </span>
                    {supplier.supportsPacketLabeling && (
                      <span className="px-2 py-0.5 text-xs bg-stark-navy/10 text-stark-navy rounded">
                        PKT
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  {poCountBySupplier.get(supplier.id) ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">OTD</div>
                      <div
                        className={`text-sm font-medium ${
                          supplier.onTimeDeliveryRate >= 0.9
                            ? "text-green-700"
                            : "text-stark-orange"
                        }`}
                      >
                        {Math.round(supplier.onTimeDeliveryRate * 100)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Quality</div>
                      <div
                        className={`text-sm font-medium ${
                          supplier.qualityScore >= 0.9
                            ? "text-green-700"
                            : "text-stark-orange"
                        }`}
                      >
                        {Math.round(supplier.qualityScore * 100)}%
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/suppliers/${supplier.id}`}>
                    <Button variant="ghost" size="sm">
                      View →
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
            {paginatedSuppliers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No suppliers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, sortedSuppliers.length)} of{" "}
            {sortedSuppliers.length} suppliers
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
