/**
 * STARK Procurement - Purchase Request Hooks
 *
 * React hooks for PR data access with Dexie live queries.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db, type PurchaseRequest } from "@/lib/db";

export type PRFilter = {
  status?: PurchaseRequest["status"];
  source?: PurchaseRequest["source"];
  branchId?: string;
  escalationLevel?: PurchaseRequest["escalationLevel"];
};

/**
 * Get all purchase requests with optional filtering
 */
export function usePurchaseRequests(filter?: PRFilter) {
  return useLiveQuery(async () => {
    let collection = db.purchaseRequests.toCollection();

    if (filter?.status) {
      collection = db.purchaseRequests.where("status").equals(filter.status);
    }

    const results = await collection.toArray();

    // Apply additional filters in memory
    return results.filter((pr) => {
      if (filter?.source && pr.source !== filter.source) return false;
      if (filter?.branchId && pr.branchId !== filter.branchId) return false;
      if (filter?.escalationLevel && pr.escalationLevel !== filter.escalationLevel) return false;
      return true;
    });
  }, [filter?.status, filter?.source, filter?.branchId, filter?.escalationLevel]);
}

/**
 * Get a single purchase request by ID
 */
export function usePurchaseRequest(id: string | undefined) {
  return useLiveQuery(
    async () => (id ? db.purchaseRequests.get(id) : undefined),
    [id]
  );
}

/**
 * Get PRs pending approval
 */
export function usePendingApprovalPRs() {
  return useLiveQuery(() =>
    db.purchaseRequests.where("status").equals("pending_approval").toArray()
  );
}

/**
 * Get PRs ready for bundling
 */
export function useReadyForBundlingPRs() {
  return useLiveQuery(() =>
    db.purchaseRequests.where("status").equals("approved").toArray()
  );
}

/**
 * Create a new PR
 */
export async function createPurchaseRequest(
  pr: Omit<PurchaseRequest, "id" | "createdAt" | "updatedAt" | "syncStatus">
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.purchaseRequests.add({
    ...pr,
    id,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  });

  // Add to sync queue
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "pr",
    entityId: id,
    operation: "create",
    payload: pr,
    status: "pending",
    createdAt: now,
    attempts: 0,
    maxAttempts: 3,
  });

  return id;
}

/**
 * Update a PR
 */
export async function updatePurchaseRequest(
  id: string,
  updates: Partial<PurchaseRequest>
): Promise<void> {
  const now = new Date();

  await db.purchaseRequests.update(id, {
    ...updates,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "pr",
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
 * Delete a PR (soft delete by setting status)
 */
export async function deletePurchaseRequest(id: string): Promise<void> {
  await updatePurchaseRequest(id, { status: "rejected" });
}
