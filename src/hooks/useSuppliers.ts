/**
 * STARK Procurement - Supplier Hooks
 *
 * React hooks for Supplier data access with Dexie live queries.
 */

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Supplier } from "@/lib/db";

export type SupplierFilter = {
  isActive?: boolean;
  category?: string;
  supportsEDI?: boolean;
};

/**
 * Get all suppliers with optional filtering
 */
export function useSuppliers(filter?: SupplierFilter) {
  return useLiveQuery(async () => {
    const results = await db.suppliers.toArray();

    return results.filter((supplier) => {
      if (filter?.isActive !== undefined && supplier.isActive !== filter.isActive) return false;
      if (filter?.category && !supplier.categories.includes(filter.category)) return false;
      if (filter?.supportsEDI !== undefined && supplier.supportsEDI !== filter.supportsEDI) return false;
      return true;
    });
  }, [filter?.isActive, filter?.category, filter?.supportsEDI]);
}

/**
 * Get a single supplier by ID
 */
export function useSupplier(id: string | undefined) {
  return useLiveQuery(
    async () => (id ? db.suppliers.get(id) : undefined),
    [id]
  );
}

/**
 * Search suppliers by name
 */
export function useSupplierSearch(query: string) {
  return useLiveQuery(async () => {
    if (!query || query.length < 2) return [];

    const results = await db.suppliers.toArray();
    const lowerQuery = query.toLowerCase();

    return results.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.supplierNumber.toLowerCase().includes(lowerQuery)
    );
  }, [query]);
}

/**
 * Get active suppliers
 */
export function useActiveSuppliers() {
  return useLiveQuery(() =>
    db.suppliers.filter((s) => s.isActive).toArray()
  );
}

/**
 * Create a new Supplier
 */
export async function createSupplier(
  supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "syncStatus">
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();

  await db.suppliers.add({
    ...supplier,
    id,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "supplier",
    entityId: id,
    operation: "create",
    payload: supplier,
    status: "pending",
    createdAt: now,
    attempts: 0,
    maxAttempts: 3,
  });

  return id;
}

/**
 * Update a Supplier
 */
export async function updateSupplier(
  id: string,
  updates: Partial<Supplier>
): Promise<void> {
  const now = new Date();

  await db.suppliers.update(id, {
    ...updates,
    updatedAt: now,
    syncStatus: "pending",
  });

  await db.syncQueue.add({
    id: crypto.randomUUID(),
    entityType: "supplier",
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
 * Deactivate a supplier
 */
export async function deactivateSupplier(id: string): Promise<void> {
  await updateSupplier(id, { isActive: false });
}
