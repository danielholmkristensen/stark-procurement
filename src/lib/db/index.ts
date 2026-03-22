/**
 * STARK Procurement - Dexie Database Instance
 *
 * IndexedDB database for local-first data persistence.
 * All data is stored locally and queued for sync with Kafka.
 */

import Dexie, { type Table } from "dexie";
import type {
  PurchaseRequest,
  PurchaseOrder,
  Invoice,
  Supplier,
  Approval,
  Feedback,
  Change,
  SyncQueueItem,
  UserSettings,
} from "./schema";

export class StarkProcurementDB extends Dexie {
  // Tables
  purchaseRequests!: Table<PurchaseRequest, string>;
  purchaseOrders!: Table<PurchaseOrder, string>;
  invoices!: Table<Invoice, string>;
  suppliers!: Table<Supplier, string>;
  approvals!: Table<Approval, string>;
  feedback!: Table<Feedback, string>;
  changes!: Table<Change, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  userSettings!: Table<UserSettings, string>;

  constructor() {
    super("StarkProcurementDB");

    this.version(1).stores({
      // Purchase Requests
      purchaseRequests: [
        "id",
        "prNumber",
        "source",
        "status",
        "branchId",
        "requesterId",
        "suggestedSupplierId",
        "escalationLevel",
        "createdAt",
        "updatedAt",
        "syncStatus",
      ].join(", "),

      // Purchase Orders
      purchaseOrders: [
        "id",
        "poNumber",
        "status",
        "supplierId",
        "branchId",
        "*prIds",
        "escalationLevel",
        "createdAt",
        "updatedAt",
        "syncStatus",
      ].join(", "),

      // Invoices
      invoices: [
        "id",
        "invoiceNumber",
        "status",
        "supplierId",
        "*poIds",
        "matchResult",
        "escalationLevel",
        "createdAt",
        "updatedAt",
        "syncStatus",
      ].join(", "),

      // Suppliers
      suppliers: [
        "id",
        "supplierNumber",
        "name",
        "isActive",
        "*categories",
        "createdAt",
        "syncStatus",
      ].join(", "),

      // Approvals
      approvals: [
        "id",
        "entityType",
        "entityId",
        "status",
        "requestedBy",
        "decidedBy",
        "escalationLevel",
        "createdAt",
        "syncStatus",
      ].join(", "),

      // Feedback
      feedback: [
        "id",
        "screenId",
        "userId",
        "type",
        "status",
        "priority",
        "createdAt",
        "syncStatus",
      ].join(", "),

      // Changes
      changes: [
        "id",
        "feedbackId",
        "source",
        "status",
        "priority",
        "assignedTo",
        "createdAt",
        "syncStatus",
      ].join(", "),

      // Sync Queue
      syncQueue: [
        "id",
        "entityType",
        "entityId",
        "operation",
        "status",
        "createdAt",
      ].join(", "),

      // User Settings
      userSettings: ["id", "userId"].join(", "),
    });
  }
}

// Create singleton instance
export const db = new StarkProcurementDB();

// Export types for convenience
export type {
  PurchaseRequest,
  PurchaseOrder,
  Invoice,
  Supplier,
  Approval,
  Feedback,
  Change,
  SyncQueueItem,
  UserSettings,
  // Enum types
  PRSource,
  PRStatus,
  POStatus,
  InvoiceStatus,
  ApprovalStatus,
  EscalationLevel,
  DeliveryType,
  SyncStatus,
  MatchResult,
  // Line item types
  PRLineItem,
  POLineItem,
  InvoiceLineItem,
} from "./schema";
