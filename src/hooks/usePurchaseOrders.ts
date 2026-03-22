/**
 * STARK Procurement - Purchase Order Hooks
 *
 * React hooks for PO data access with Dexie live queries.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db, type PurchaseOrder, type POStatus } from "@/lib/db";

export type POFilter = {
  status?: POStatus;
  supplierId?: string;
  branchId?: string;
};

/**
 * Get all purchase orders with optional filtering
 */
export function usePurchaseOrders(filter?: POFilter) {
  return useLiveQuery(async () => {
    let collection = db.purchaseOrders.toCollection();

    if (filter?.status) {
      collection = db.purchaseOrders.where("status").equals(filter.status);
    }

    const results = await collection.toArray();

    // Apply additional filters in memory
    return results.filter((po) => {
      if (filter?.supplierId && po.supplierId !== filter.supplierId) return false;
      if (filter?.branchId && po.branchId !== filter.branchId) return false;
      return true;
    });
  }, [filter?.status, filter?.supplierId, filter?.branchId]);
}

/**
 * Get a single purchase order by ID
 */
export function usePurchaseOrder(id: string | undefined) {
  return useLiveQuery(
    async () => (id ? db.purchaseOrders.get(id) : undefined),
    [id]
  );
}

/**
 * Get POs by status
 */
export function usePOsByStatus(status: POStatus) {
  return useLiveQuery(() =>
    db.purchaseOrders.where("status").equals(status).toArray()
  );
}

/**
 * Get POs pending approval
 */
export function usePendingApprovalPOs() {
  return useLiveQuery(() =>
    db.purchaseOrders.where("status").equals("pending_approval").toArray()
  );
}

/**
 * Create a new PO
 */
export async function createPurchaseOrder(
  po: Omit<PurchaseOrder, "id" | "createdAt" | "updatedAt" | "syncStatus">
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.purchaseOrders.add({
    ...po,
    id,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "po",
    entityId: id,
    operation: "create",
    payload: po,
    status: "pending",
    createdAt: now,
    attempts: 0,
    maxAttempts: 3,
  });

  return id;
}

/**
 * Update a PO
 */
export async function updatePurchaseOrder(
  id: string,
  updates: Partial<PurchaseOrder>
): Promise<void> {
  const now = new Date();

  await db.purchaseOrders.update(id, {
    ...updates,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "po",
    entityId: id,
    operation: "update",
    payload: updates,
    status: "pending",
    createdAt: now,
    attempts: 0,
    maxAttempts: 3,
  });
}

/**
 * Update PO status
 */
export async function updatePOStatus(id: string, status: POStatus): Promise<void> {
  await updatePurchaseOrder(id, { status });
}

/**
 * Mark PO as sent
 */
export async function sendPurchaseOrder(
  id: string,
  via: "email" | "edi" | "portal"
): Promise<void> {
  await updatePurchaseOrder(id, {
    status: "sent",
    sentAt: new Date(),
    sentVia: via,
  });
}
