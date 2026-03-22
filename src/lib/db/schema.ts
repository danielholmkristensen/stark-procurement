/**
 * STARK Procurement - Database Schema
 *
 * All data types for IndexedDB storage via Dexie.
 * This enables local-first operation before Kafka integration.
 */

// ============================================================================
// CORE ENUMS
// ============================================================================

export type PRSource = "relex" | "ecom" | "salesapp" | "manual";

export type PRStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "converted";

export type POStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "confirmed"
  | "partially_received"
  | "received"
  | "completed"
  | "cancelled";

export type InvoiceStatus =
  | "received"
  | "pending_match"
  | "matched"
  | "discrepancy"
  | "approved"
  | "paid"
  | "rejected";

export type MatchResult =
  | "full_match"
  | "quantity_mismatch"
  | "price_mismatch"
  | "missing_po"
  | "partial_match";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type EscalationLevel =
  | "ambient"
  | "awareness"
  | "attention"
  | "action"
  | "urgent";

export type DeliveryType =
  | "branch"
  | "direct_to_customer"
  | "cross_dock";

export type SyncStatus = "pending" | "synced" | "failed" | "conflict";

// ============================================================================
// LINE ITEM TYPES
// ============================================================================

export interface PRLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  currency: string;
  deliveryDate?: Date;
  notes?: string;
}

export interface POLineItem {
  id: string;
  prLineItemId?: string; // Link to original PR line
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  deliveryDate?: Date;
  receivedQuantity: number;
  notes?: string;
}

export interface InvoiceLineItem {
  id: string;
  poLineItemId?: string; // Link to PO line for matching
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  matchStatus?: MatchResult;
  variance?: number;
}

// ============================================================================
// MAIN ENTITIES
// ============================================================================

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  source: PRSource;
  status: PRStatus;

  // Requester info
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;

  // Location
  branchId: string;
  branchName: string;

  // Delivery
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  requestedDeliveryDate?: Date;

  // Items
  lineItems: PRLineItem[];
  totalEstimatedValue: number;
  currency: string;

  // Supplier suggestion
  suggestedSupplierId?: string;
  suggestedSupplierName?: string;

  // Processing
  poTiming?: "immediate" | "next_cutoff" | "manual";
  priority: "low" | "normal" | "high" | "urgent";
  escalationLevel: EscalationLevel;

  // Metadata
  notes?: string;
  externalReference?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  convertedAt?: Date;

  // Sync
  syncStatus: SyncStatus;
  syncedAt?: Date;
  kafkaOffset?: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: POStatus;

  // Linked PRs (bundling)
  prIds: string[];

  // Supplier
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierContact?: string;

  // Location
  branchId: string;
  branchName: string;

  // Delivery
  deliveryType: DeliveryType;
  deliveryAddress: string;
  requestedDeliveryDate: Date;
  confirmedDeliveryDate?: Date;

  // Items
  lineItems: POLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;

  // Bundling
  supportsPacketLabeling: boolean;
  packetCount: number;

  // Approval
  requiresApproval: boolean;
  approvalThreshold?: number;
  approvedBy?: string;
  approvedAt?: Date;

  // Communication
  sentAt?: Date;
  sentVia?: "email" | "edi" | "portal";
  confirmedAt?: Date;
  supplierOrderNumber?: string;

  // Processing
  escalationLevel: EscalationLevel;

  // Metadata
  notes?: string;
  internalNotes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  // Sync
  syncStatus: SyncStatus;
  syncedAt?: Date;
  kafkaOffset?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;

  // Supplier
  supplierId: string;
  supplierName: string;
  supplierInvoiceRef: string;

  // PO Reference
  poIds: string[];

  // Financial
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;

  // Dates
  invoiceDate: Date;
  dueDate: Date;
  receivedDate: Date;

  // Matching
  matchResult?: MatchResult;
  matchScore?: number;
  discrepancyAmount?: number;
  discrepancyNotes?: string;

  // Processing
  escalationLevel: EscalationLevel;

  // Approval
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;

  // Payment
  paidAt?: Date;
  paymentReference?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Sync
  syncStatus: SyncStatus;
  syncedAt?: Date;
  kafkaOffset?: number;
}

export interface Supplier {
  id: string;
  supplierNumber: string;
  name: string;
  legalName?: string;

  // Contact
  email: string;
  phone?: string;
  website?: string;

  // Address
  address: string;
  city: string;
  postalCode: string;
  country: string;

  // Capabilities
  supportsPacketLabeling: boolean;
  supportsEDI: boolean;
  preferredCommunication: "email" | "edi" | "portal";

  // Financial
  currency: string;
  paymentTerms: string;
  taxId?: string;

  // Performance
  averageLeadTimeDays: number;
  onTimeDeliveryRate: number;
  qualityScore: number;

  // Categories
  categories: string[];

  // Status
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Sync
  syncStatus: SyncStatus;
  syncedAt?: Date;
}

export interface Approval {
  id: string;
  entityType: "pr" | "po" | "invoice";
  entityId: string;

  // Request
  requestedBy: string;
  requestedByName: string;
  requestedAt: Date;

  // Amounts
  amount: number;
  currency: string;
  threshold: number;

  // Decision
  status: ApprovalStatus;
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: Date;

  // Details
  reason?: string;
  comments?: string;

  // Escalation
  escalationLevel: EscalationLevel;
  escalatedAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Sync
  syncStatus: SyncStatus;
  syncedAt?: Date;
}

export interface Feedback {
  id: string;

  // Context
  screenId: string;
  screenName: string;
  elementId?: string;
  url: string;

  // User
  userId: string;
  userName: string;

  // Content
  type: "bug" | "feature" | "improvement" | "question";
  title: string;
  description: string;

  // Agent conversation
  conversationHistory: Array<{
    role: "user" | "agent";
    message: string;
    timestamp: Date;
  }>;

  // Status
  status: "new" | "acknowledged" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "critical";

  // Resolution
  changeId?: string;
  resolution?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;

  // Sync
  syncStatus: SyncStatus;
  syncedAt?: Date;
}

export interface Change {
  id: string;

  // Source
  feedbackId?: string;
  source: "feedback" | "requirement" | "bug" | "enhancement";

  // Description
  title: string;
  description: string;

  // Scope
  screenIds: string[];
  components: string[];

  // Status
  status: "proposed" | "approved" | "in_development" | "testing" | "deployed" | "rejected";
  priority: "low" | "normal" | "high" | "critical";

  // Assignment
  assignedTo?: string;
  assignedToName?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;

  // Sync
  syncStatus: SyncStatus;
  syncedAt?: Date;
}

// ============================================================================
// SYNC QUEUE
// ============================================================================

export interface SyncQueueItem {
  id: string;
  entityType: "pr" | "po" | "invoice" | "supplier" | "approval" | "feedback" | "change";
  entityId: string;
  operation: "create" | "update" | "delete";
  payload: unknown;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  lastError?: string;
  createdAt: Date;
  status: "pending" | "processing" | "completed" | "failed";
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface UserSettings {
  id: string;
  userId: string;

  // Display
  theme: "light" | "dark" | "system";
  locale: string;
  currency: string;

  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;

  // Table preferences
  tablePageSize: number;

  // Last sync
  lastExportAt?: Date;
  lastImportAt?: Date;

  // Timestamps
  updatedAt: Date;
}
