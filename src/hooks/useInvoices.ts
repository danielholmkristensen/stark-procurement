/**
 * STARK Procurement - Invoice Hooks
 *
 * React hooks for Invoice data access with Dexie live queries.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Invoice, type InvoiceStatus, type MatchResult } from "@/lib/db";

export type InvoiceFilter = {
  status?: InvoiceStatus;
  supplierId?: string;
  matchResult?: MatchResult;
};

/**
 * Get all invoices with optional filtering
 */
export function useInvoices(filter?: InvoiceFilter) {
  return useLiveQuery(async () => {
    let collection = db.invoices.toCollection();

    if (filter?.status) {
      collection = db.invoices.where("status").equals(filter.status);
    }

    const results = await collection.toArray();

    // Apply additional filters in memory
    return results.filter((inv) => {
      if (filter?.supplierId && inv.supplierId !== filter.supplierId) return false;
      if (filter?.matchResult && inv.matchResult !== filter.matchResult) return false;
      return true;
    });
  }, [filter?.status, filter?.supplierId, filter?.matchResult]);
}

/**
 * Get a single invoice by ID
 */
export function useInvoice(id: string | undefined) {
  return useLiveQuery(
    async () => (id ? db.invoices.get(id) : undefined),
    [id]
  );
}

/**
 * Get invoices awaiting match
 */
export function useAwaitingMatchInvoices() {
  return useLiveQuery(() =>
    db.invoices.where("status").equals("pending_match").toArray()
  );
}

/**
 * Get invoices with discrepancies
 */
export function useDiscrepancyInvoices() {
  return useLiveQuery(() =>
    db.invoices.where("status").equals("discrepancy").toArray()
  );
}

/**
 * Create a new Invoice
 */
export async function createInvoice(
  invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "syncStatus">
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.invoices.add({
    ...invoice,
    id,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "invoice",
    entityId: id,
    operation: "create",
    payload: invoice,
    status: "pending",
    createdAt: now,
    attempts: 0,
    maxAttempts: 3,
  });

  return id;
}

/**
 * Update an Invoice
 */
export async function updateInvoice(
  id: string,
  updates: Partial<Invoice>
): Promise<void> {
  const now = new Date();

  await db.invoices.update(id, {
    ...updates,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "invoice",
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
 * Match an invoice to PO
 */
export async function matchInvoice(
  id: string,
  matchResult: MatchResult,
  matchScore: number
): Promise<void> {
  await updateInvoice(id, {
    status: matchResult === "full_match" ? "matched" : "discrepancy",
    matchResult,
    matchScore,
  });
}

/**
 * Approve an invoice
 */
export async function approveInvoice(id: string, approvedBy: string): Promise<void> {
  await updateInvoice(id, {
    status: "approved",
    approvedBy,
    approvedAt: new Date(),
  });
}
