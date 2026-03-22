"use client";

/**
 * Supplier List
 *
 * Compact layout with inline stats and tighter spacing.
 * Follows Command Center UX principles.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSuppliers, usePurchaseOrders } from "@/hooks";
import { Button, SearchInput, Select, CompactStats } from "@/components/ui";

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "Building Materials", label: "Building Materials" },
  { value: "Electrical", label: "Electrical" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "Tools", label: "Tools" },
  { value: "Timber", label: "Timber" },
  { value: "HVAC", label: "HVAC" },
];

export function SupplierList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const allSuppliers = useSuppliers();
  const allPOs = usePurchaseOrders();

  // Calculate PO counts per supplier
  const poCountBySupplier = useMemo(() => {
    const counts = new Map<string, number>();
    allPOs?.forEach((po) => {
      const current = counts.get(po.supplierId) ?? 0;
      counts.set(po.supplierId, current + 1);
    });
    return counts;
  }, [allPOs]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return (allSuppliers ?? []).filter((supplier) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          supplier.name.toLowerCase().includes(searchLower) ||
          supplier.supplierNumber.toLowerCase().includes(searchLower) ||
          supplier.email.toLowerCase().includes(searchLower) ||
          supplier.city.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      if (category !== "all" && !supplier.categories.includes(category)) return false;
      if (statusFilter === "active" && !supplier.isActive) return false;
      if (statusFilter === "inactive" && supplier.isActive) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSuppliers, search, category, statusFilter]);

  const getPerformanceColor = (rate: number) => {
    if (rate >= 0.95) return "text-green-600";
    if (rate >= 0.85) return "text-stark-navy";
    return "text-stark-orange";
  };

  // Stats
  const stats = [
    {
      label: "Total",
      value: allSuppliers?.length ?? 0,
      filter: "all",
    },
    {
      label: "Active",
      value: allSuppliers?.filter((s) => s.isActive).length ?? 0,
      filter: "active",
      variant: "success" as const,
    },
    {
      label: "EDI",
      value: allSuppliers?.filter((s) => s.supportsEDI).length ?? 0,
    },
    {
      label: "PKT",
      value: allSuppliers?.filter((s) => s.supportsPacketLabeling).length ?? 0,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Compact Stats + Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <CompactStats
            stats={stats}
            activeFilter={statusFilter}
            onFilterChange={(f) => setStatusFilter(f as typeof statusFilter)}
          />
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers..."
            />
          </div>
          <Select
            options={categoryOptions}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Location
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Categories
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Comm
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                POs
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                OTD
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Quality
              </th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50 group">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        supplier.isActive ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <div>
                      <Link
                        href={`/suppliers/${supplier.id}`}
                        className="font-medium text-stark-navy hover:underline text-sm"
                      >
                        {supplier.name}
                      </Link>
                      <div className="text-xs text-gray-400">{supplier.supplierNumber}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-gray-500">
                  {supplier.city}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {supplier.categories.slice(0, 2).map((cat) => (
                      <span
                        key={cat}
                        className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {cat.length > 12 ? cat.slice(0, 10) + "..." : cat}
                      </span>
                    ))}
                    {supplier.categories.length > 2 && (
                      <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-400 rounded">
                        +{supplier.categories.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-stark-navy-10 text-stark-navy rounded">
                      {supplier.preferredCommunication.toUpperCase()}
                    </span>
                    {supplier.supportsPacketLabeling && (
                      <span className="px-1 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                        PKT
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-right font-medium text-gray-600">
                  {poCountBySupplier.get(supplier.id) ?? 0}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-sm font-medium ${getPerformanceColor(supplier.onTimeDeliveryRate)}`}>
                    {Math.round(supplier.onTimeDeliveryRate * 100)}%
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-sm font-medium ${getPerformanceColor(supplier.qualityScore)}`}>
                    {Math.round(supplier.qualityScore * 100)}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/suppliers/${supplier.id}`}
                    className="text-stark-navy group-hover:text-stark-orange text-sm"
                  >
                    →
                  </Link>
                </td>
              </tr>
            ))}
            {filteredSuppliers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                  No suppliers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
