/**
 * STARK Procurement - Approval Hooks
 *
 * React hooks for Approval data access with Dexie live queries.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Approval, type ApprovalStatus } from "@/lib/db";

export type ApprovalFilter = {
  status?: ApprovalStatus;
  entityType?: "pr" | "po" | "invoice";
};

/**
 * Get all approvals with optional filtering
 */
export function useApprovals(filter?: ApprovalFilter) {
  return useLiveQuery(async () => {
    const results = await db.approvals.toArray();

    return results.filter((approval) => {
      if (filter?.status && approval.status !== filter.status) return false;
      if (filter?.entityType && approval.entityType !== filter.entityType) return false;
      return true;
    });
  }, [filter?.status, filter?.entityType]);
}

/**
 * Get a single approval by ID
 */
export function useApproval(id: string | undefined) {
  return useLiveQuery(
    async () => (id ? db.approvals.get(id) : undefined),
    [id]
  );
}

/**
 * Get pending approvals
 */
export function usePendingApprovals() {
  return useLiveQuery(() =>
    db.approvals.where("status").equals("pending").toArray()
  );
}

/**
 * Get approvals for a specific entity
 */
export function useEntityApprovals(entityType: "pr" | "po" | "invoice", entityId: string) {
  return useLiveQuery(
    () =>
      db.approvals
        .filter((a) => a.entityType === entityType && a.entityId === entityId)
        .toArray(),
    [entityType, entityId]
  );
}

/**
 * Create an approval request
 */
export async function createApproval(
  approval: Omit<Approval, "id" | "createdAt" | "updatedAt" | "syncStatus">
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.approvals.add({
    ...approval,
    id,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "approval",
    entityId: id,
    operation: "create",
    payload: approval,
    status: "pending",
    createdAt: now,
    attempts: 0,
    maxAttempts: 3,
  });

  return id;
}

/**
 * Approve an approval request
 */
export async function approveRequest(
  id: string,
  decidedBy: string,
  decidedByName: string,
  comments?: string
): Promise<void> {
  const now = new Date();

  await db.approvals.update(id, {
    status: "approved",
    decidedBy,
    decidedByName,
    decidedAt: now,
    comments,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "approval",
    entityId: id,
    operation: "update",
    payload: { status: "approved", decidedBy, decidedByName, comments },
    status: "pending",
    createdAt: now,
    attempts: 0,
    maxAttempts: 3,
  });
}

/**
 * Reject an approval request
 */
export async function rejectRequest(
  id: string,
  decidedBy: string,
  decidedByName: string,
  reason: string
): Promise<void> {
  const now = new Date();

  await db.approvals.update(id, {
    status: "rejected",
    decidedBy,
    decidedByName,
    decidedAt: now,
    reason,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "approval",
    entityId: id,
    operation: "update",
    payload: { status: "rejected", decidedBy, decidedByName, reason },
    status: "pending",
    createdAt: now,
    attempts: 0,
    maxAttempts: 3,
  });
}
