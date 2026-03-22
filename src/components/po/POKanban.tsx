"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePurchaseOrders } from "@/hooks";
import type { POStatus, PurchaseOrder } from "@/lib/db";

interface KanbanColumn {
  status: POStatus;
  label: string;
  color: string;
}

const columns: KanbanColumn[] = [
  { status: "draft", label: "Draft", color: "text-gray-700" },
  { status: "sent", label: "Sent", color: "text-gray-700" },
  { status: "confirmed", label: "Confirmed", color: "text-gray-700" },
  { status: "received", label: "Received", color: "text-green-700" },
];

export function POKanban() {
  const allPOs = usePurchaseOrders();

  const posByStatus = useMemo(() => {
    if (!allPOs) return {};
    const grouped: Record<string, PurchaseOrder[]> = {};
    columns.forEach((col) => { grouped[col.status] = []; });
    allPOs.forEach((po) => {
      if (grouped[po.status]) grouped[po.status].push(po);
      else if (po.status === "pending_approval" || po.status === "approved") grouped["draft"]?.push(po);
      else if (po.status === "partially_received") grouped["confirmed"]?.push(po);
      else if (po.status === "completed") grouped["received"]?.push(po);
    });
    return grouped;
  }, [allPOs]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", minimumFractionDigits: 0 }).format(value);

  if (!allPOs) {
    return <div className="bg-white rounded-lg border p-8 text-center text-gray-400">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.status} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className={`font-semibold ${col.color}`}>{col.label}</h4>
            <span className={`px-2 py-0.5 ${col.status === "received" ? "bg-green-600" : "bg-stark-navy"} text-white rounded-full text-sm font-medium`}>
              {posByStatus[col.status]?.length || 0}
            </span>
          </div>
          <div className="space-y-3">
            {posByStatus[col.status]?.slice(0, 5).map((po) => (
              <Link key={po.id} href={`/pos/${po.id}`}>
                <div className={`bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                  po.escalationLevel === "attention" || po.escalationLevel === "action" || po.escalationLevel === "urgent"
                    ? "border-l-4 border-stark-orange"
                    : col.status === "received" ? "border border-green-200" : "border border-gray-200"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{po.poNumber}</span>
                    {po.escalationLevel === "urgent" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-stark-orange opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-stark-orange" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{po.supplierName}</p>
                  {po.confirmedDeliveryDate && col.status === "confirmed" && (
                    <p className="text-xs text-green-600 mt-1">ETA: {new Date(po.confirmedDeliveryDate).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}</p>
                  )}
                  <p className="text-sm font-medium mt-1">{formatCurrency(po.total)}</p>
                </div>
              </Link>
            ))}
            {(posByStatus[col.status]?.length || 0) > 5 && (
              <p className="text-center text-xs text-gray-400">+{(posByStatus[col.status]?.length || 0) - 5} more</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
