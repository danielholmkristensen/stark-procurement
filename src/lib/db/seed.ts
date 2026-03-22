/**
 * STARK Procurement - Mock Data Seeder
 *
 * Populates IndexedDB with sample data for development.
 * Run via: npm run seed OR import seedDatabase function.
 */

import { db } from "./index";
import type {
  PurchaseRequest,
  PurchaseOrder,
  Invoice,
  Supplier,
  Approval,
  PRLineItem,
  POLineItem,
  InvoiceLineItem,
  PRSource,
  PRStatus,
  POStatus,
  InvoiceStatus,
  EscalationLevel,
  DeliveryType,
  SyncStatus,
  ApprovalStatus,
  MatchResult,
} from "./schema";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function uuid(): string {
  return crypto.randomUUID();
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number, daysForward: number = 0): Date {
  const now = Date.now();
  const minMs = now - daysBack * 24 * 60 * 60 * 1000;
  const maxMs = now + daysForward * 24 * 60 * 60 * 1000;
  return new Date(randomNumber(minMs, maxMs));
}

function formatPRNumber(index: number): string {
  return `PR-${String(index).padStart(5, "0")}`;
}

function formatPONumber(index: number): string {
  return `PO-${String(index).padStart(5, "0")}`;
}

function formatInvoiceNumber(index: number): string {
  return `INV-${String(index).padStart(4, "0")}`;
}

function formatSupplierNumber(index: number): string {
  return `SUP-${String(index).padStart(4, "0")}`;
}

// ============================================================================
// SAMPLE DATA POOLS
// ============================================================================

const branches = [
  { id: "branch-001", name: "Copenhagen Central" },
  { id: "branch-002", name: "Aarhus North" },
  { id: "branch-003", name: "Odense Main" },
  { id: "branch-004", name: "Aalborg Distribution" },
  { id: "branch-005", name: "Esbjerg Harbor" },
];

const requesters = [
  { id: "user-001", name: "Anders Nielsen", email: "anders.nielsen@stark.dk" },
  { id: "user-002", name: "Mette Hansen", email: "mette.hansen@stark.dk" },
  { id: "user-003", name: "Lars Pedersen", email: "lars.pedersen@stark.dk" },
  { id: "user-004", name: "Sofie Jørgensen", email: "sofie.jorgensen@stark.dk" },
  { id: "user-005", name: "Thomas Andersen", email: "thomas.andersen@stark.dk" },
];

const products = [
  { id: "prod-001", name: "Concrete Mix 25kg", sku: "CMX-25", unit: "bag", price: 45 },
  { id: "prod-002", name: "Steel Beam 6m", sku: "STB-6M", unit: "piece", price: 320 },
  { id: "prod-003", name: "Timber 50x100mm 3m", sku: "TMB-5010", unit: "piece", price: 85 },
  { id: "prod-004", name: "Insulation Roll 10m²", sku: "INS-10", unit: "roll", price: 195 },
  { id: "prod-005", name: "Roof Tiles Red", sku: "RTL-RED", unit: "pack", price: 420 },
  { id: "prod-006", name: "PVC Pipe 110mm 3m", sku: "PVC-110", unit: "piece", price: 55 },
  { id: "prod-007", name: "Electrical Cable 2.5mm 100m", sku: "ELC-25", unit: "roll", price: 289 },
  { id: "prod-008", name: "Plasterboard 1200x2400", sku: "PLB-12", unit: "sheet", price: 75 },
  { id: "prod-009", name: "Door Frame Oak", sku: "DRF-OAK", unit: "set", price: 650 },
  { id: "prod-010", name: "Window Double Glazed 1x1.2m", sku: "WDG-112", unit: "piece", price: 890 },
];

const supplierNames = [
  "Nordic Building Supplies",
  "Danish Steel Works",
  "Scandia Timber AS",
  "EcoInsulate Denmark",
  "Roskilde Roofing",
  "Copenhagen Pipes Ltd",
  "ElectroSupply Nordic",
  "Plaster Pro Denmark",
  "Fine Woodwork AS",
  "GlassTech Scandinavia",
  "BetongMix Nordic",
  "MetalCraft Denmark",
  "GreenBuild Materials",
  "QualityStone AS",
  "SafetyFirst Supplies",
];

const categories = [
  "Building Materials",
  "Steel & Metal",
  "Timber & Wood",
  "Insulation",
  "Roofing",
  "Plumbing",
  "Electrical",
  "Interior Finishes",
  "Doors & Windows",
  "Tools & Equipment",
];

const cities = ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Roskilde", "Kolding"];

// ============================================================================
// GENERATORS
// ============================================================================

function generatePRLineItems(count: number): PRLineItem[] {
  const items: PRLineItem[] = [];
  const usedProducts = new Set<string>();

  for (let i = 0; i < count; i++) {
    let product = randomItem(products);
    while (usedProducts.has(product.id) && usedProducts.size < products.length) {
      product = randomItem(products);
    }
    usedProducts.add(product.id);

    items.push({
      id: uuid(),
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: randomNumber(1, 50),
      unit: product.unit,
      estimatedPrice: product.price,
      currency: "DKK",
      deliveryDate: randomDate(-5, 14),
    });
  }

  return items;
}

function generatePOLineItems(prLineItems: PRLineItem[]): POLineItem[] {
  return prLineItems.map((prItem) => ({
    id: uuid(),
    prLineItemId: prItem.id,
    productId: prItem.productId,
    productName: prItem.productName,
    sku: prItem.sku,
    quantity: prItem.quantity,
    unit: prItem.unit,
    unitPrice: prItem.estimatedPrice,
    totalPrice: prItem.quantity * prItem.estimatedPrice,
    currency: "DKK",
    deliveryDate: prItem.deliveryDate,
    receivedQuantity: 0,
  }));
}

function generateInvoiceLineItems(poLineItems: POLineItem[]): InvoiceLineItem[] {
  return poLineItems.map((poItem) => {
    const variance = Math.random() > 0.8 ? randomNumber(-10, 10) : 0;
    const matchStatus: MatchResult = variance === 0 ? "full_match" : variance > 0 ? "price_mismatch" : "quantity_mismatch";

    return {
      id: uuid(),
      poLineItemId: poItem.id,
      productId: poItem.productId,
      productName: poItem.productName,
      sku: poItem.sku,
      quantity: poItem.quantity,
      unit: poItem.unit,
      unitPrice: poItem.unitPrice + variance,
      totalPrice: poItem.quantity * (poItem.unitPrice + variance),
      currency: "DKK",
      matchStatus,
      variance: variance !== 0 ? variance : undefined,
    };
  });
}

// ============================================================================
// MAIN SEED FUNCTIONS
// ============================================================================

function generateSuppliers(count: number): Supplier[] {
  const suppliers: Supplier[] = [];

  for (let i = 0; i < count; i++) {
    const supplierName = supplierNames[i % supplierNames.length];
    const city = randomItem(cities);
    const now = new Date();

    suppliers.push({
      id: uuid(),
      supplierNumber: formatSupplierNumber(i + 1),
      name: supplierName,
      legalName: `${supplierName} ApS`,
      email: `orders@${supplierName.toLowerCase().replace(/\s+/g, "")}.dk`,
      phone: `+45 ${randomNumber(20, 99)} ${randomNumber(10, 99)} ${randomNumber(10, 99)} ${randomNumber(10, 99)}`,
      website: `https://www.${supplierName.toLowerCase().replace(/\s+/g, "")}.dk`,
      address: `Industrievej ${randomNumber(1, 200)}`,
      city,
      postalCode: String(randomNumber(1000, 9999)),
      country: "Denmark",
      supportsPacketLabeling: Math.random() > 0.3,
      supportsEDI: Math.random() > 0.5,
      preferredCommunication: randomItem(["email", "edi", "portal"] as const),
      currency: "DKK",
      paymentTerms: randomItem(["Net 30", "Net 45", "Net 60", "2% 10 Net 30"]),
      taxId: `DK${randomNumber(10000000, 99999999)}`,
      averageLeadTimeDays: randomNumber(2, 14),
      onTimeDeliveryRate: randomNumber(85, 99) / 100,
      qualityScore: randomNumber(80, 100) / 100,
      categories: [randomItem(categories), randomItem(categories)].filter(
        (v, i, a) => a.indexOf(v) === i
      ),
      isActive: Math.random() > 0.1,
      createdAt: randomDate(365, 0),
      updatedAt: now,
      syncStatus: "synced" as SyncStatus,
    });
  }

  return suppliers;
}

function generatePurchaseRequests(count: number, suppliers: Supplier[]): PurchaseRequest[] {
  const prs: PurchaseRequest[] = [];
  const prSources: PRSource[] = ["relex", "ecom", "salesapp", "manual"];
  const prStatuses: PRStatus[] = ["draft", "pending", "approved", "rejected", "converted"];
  const escalationLevels: EscalationLevel[] = ["ambient", "awareness", "attention", "action", "urgent"];
  const deliveryTypes: DeliveryType[] = ["branch", "direct_to_customer", "cross_dock"];

  for (let i = 0; i < count; i++) {
    const branch = randomItem(branches);
    const requester = randomItem(requesters);
    const supplier = randomItem(suppliers);
    const lineItems = generatePRLineItems(randomNumber(1, 5));
    const totalValue = lineItems.reduce((sum, item) => sum + item.quantity * item.estimatedPrice, 0);
    const now = new Date();
    const status = randomItem(prStatuses);

    prs.push({
      id: uuid(),
      prNumber: formatPRNumber(i + 1),
      source: randomItem(prSources),
      status,
      requesterId: requester.id,
      requesterName: requester.name,
      requesterEmail: requester.email,
      branchId: branch.id,
      branchName: branch.name,
      deliveryType: randomItem(deliveryTypes),
      deliveryAddress: `${branch.name}, Warehouse A`,
      requestedDeliveryDate: randomDate(-2, 14),
      lineItems,
      totalEstimatedValue: totalValue,
      currency: "DKK",
      suggestedSupplierId: supplier.id,
      suggestedSupplierName: supplier.name,
      poTiming: randomItem(["immediate", "next_cutoff", "manual"] as const),
      priority: randomItem(["low", "normal", "high", "urgent"] as const),
      escalationLevel: randomItem(escalationLevels),
      notes: Math.random() > 0.7 ? "Rush order - customer waiting" : undefined,
      createdAt: randomDate(30, 0),
      updatedAt: now,
      approvedAt: status === "approved" || status === "converted" ? randomDate(10, 0) : undefined,
      convertedAt: status === "converted" ? randomDate(5, 0) : undefined,
      syncStatus: "synced" as SyncStatus,
    });
  }

  return prs;
}

function generatePurchaseOrders(
  count: number,
  prs: PurchaseRequest[],
  suppliers: Supplier[]
): PurchaseOrder[] {
  const pos: PurchaseOrder[] = [];
  const poStatuses: POStatus[] = [
    "draft",
    "pending_approval",
    "approved",
    "sent",
    "confirmed",
    "partially_received",
    "received",
    "completed",
  ];
  const escalationLevels: EscalationLevel[] = ["ambient", "awareness", "attention", "action", "urgent"];

  // Use converted PRs for POs
  const convertedPRs = prs.filter((pr) => pr.status === "converted");

  for (let i = 0; i < count; i++) {
    const pr = convertedPRs[i % convertedPRs.length] || prs[i % prs.length];
    const supplier = suppliers.find((s) => s.id === pr.suggestedSupplierId) || randomItem(suppliers);
    const lineItems = generatePOLineItems(pr.lineItems);
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.25; // Danish VAT
    const status = randomItem(poStatuses);
    const now = new Date();

    pos.push({
      id: uuid(),
      poNumber: formatPONumber(i + 1),
      status,
      prIds: [pr.id],
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierEmail: supplier.email,
      supplierContact: supplier.name.split(" ")[0],
      branchId: pr.branchId,
      branchName: pr.branchName,
      deliveryType: pr.deliveryType,
      deliveryAddress: pr.deliveryAddress || `${pr.branchName}, Warehouse A`,
      requestedDeliveryDate: pr.requestedDeliveryDate || randomDate(-2, 14),
      confirmedDeliveryDate:
        status !== "draft" && status !== "pending_approval" ? randomDate(-2, 14) : undefined,
      lineItems,
      subtotal,
      tax,
      total: subtotal + tax,
      currency: "DKK",
      supportsPacketLabeling: supplier.supportsPacketLabeling,
      packetCount: 1,
      requiresApproval: subtotal > 50000,
      approvalThreshold: 50000,
      approvedBy:
        status !== "draft" && status !== "pending_approval" ? "user-001" : undefined,
      approvedAt:
        status !== "draft" && status !== "pending_approval" ? randomDate(10, 0) : undefined,
      sentAt: ["sent", "confirmed", "partially_received", "received", "completed"].includes(status)
        ? randomDate(5, 0)
        : undefined,
      sentVia: ["sent", "confirmed", "partially_received", "received", "completed"].includes(status)
        ? randomItem(["email", "edi", "portal"] as const)
        : undefined,
      confirmedAt: ["confirmed", "partially_received", "received", "completed"].includes(status)
        ? randomDate(3, 0)
        : undefined,
      supplierOrderNumber: ["confirmed", "partially_received", "received", "completed"].includes(
        status
      )
        ? `SO-${randomNumber(10000, 99999)}`
        : undefined,
      escalationLevel: randomItem(escalationLevels),
      notes: Math.random() > 0.8 ? "Standard order" : undefined,
      createdAt: randomDate(30, 0),
      updatedAt: now,
      completedAt: status === "completed" ? randomDate(2, 0) : undefined,
      syncStatus: "synced" as SyncStatus,
    });
  }

  return pos;
}

function generateInvoices(count: number, pos: PurchaseOrder[], suppliers: Supplier[]): Invoice[] {
  const invoices: Invoice[] = [];
  const invoiceStatuses: InvoiceStatus[] = [
    "received",
    "pending_match",
    "matched",
    "discrepancy",
    "approved",
    "paid",
  ];
  const escalationLevels: EscalationLevel[] = ["ambient", "awareness", "attention", "action", "urgent"];

  // Use POs that are at least "sent" status
  const eligiblePOs = pos.filter((po) =>
    ["sent", "confirmed", "partially_received", "received", "completed"].includes(po.status)
  );

  for (let i = 0; i < count; i++) {
    const po = eligiblePOs[i % eligiblePOs.length] || pos[i % pos.length];
    const supplier = suppliers.find((s) => s.id === po.supplierId) || randomItem(suppliers);
    const lineItems = generateInvoiceLineItems(po.lineItems);
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.25;
    const hasVariance = lineItems.some((item) => item.matchStatus !== "full_match");
    const status = hasVariance
      ? randomItem(["discrepancy", "pending_match"] as InvoiceStatus[])
      : randomItem(invoiceStatuses);
    const now = new Date();

    invoices.push({
      id: uuid(),
      invoiceNumber: formatInvoiceNumber(i + 1001),
      status,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierInvoiceRef: `${supplier.supplierNumber}-${randomNumber(1000, 9999)}`,
      poIds: [po.id],
      lineItems,
      subtotal,
      tax,
      total: subtotal + tax,
      currency: "DKK",
      invoiceDate: randomDate(14, 0),
      dueDate: randomDate(-30, 30),
      receivedDate: randomDate(7, 0),
      matchResult: hasVariance
        ? randomItem(["price_mismatch", "quantity_mismatch", "partial_match"] as MatchResult[])
        : "full_match",
      matchScore: hasVariance ? randomNumber(70, 95) : 100,
      discrepancyAmount: hasVariance ? Math.abs(po.total - (subtotal + tax)) : undefined,
      discrepancyNotes: hasVariance ? "Price variance detected on line items" : undefined,
      escalationLevel: hasVariance
        ? randomItem(["attention", "action"] as EscalationLevel[])
        : randomItem(escalationLevels),
      approvedBy: ["approved", "paid"].includes(status) ? "user-002" : undefined,
      approvedAt: ["approved", "paid"].includes(status) ? randomDate(5, 0) : undefined,
      paidAt: status === "paid" ? randomDate(2, 0) : undefined,
      paymentReference: status === "paid" ? `PAY-${randomNumber(100000, 999999)}` : undefined,
      createdAt: randomDate(30, 0),
      updatedAt: now,
      syncStatus: "synced" as SyncStatus,
    });
  }

  return invoices;
}

function generateApprovals(
  count: number,
  prs: PurchaseRequest[],
  pos: PurchaseOrder[],
  invoices: Invoice[]
): Approval[] {
  const approvals: Approval[] = [];
  const approvalStatuses: ApprovalStatus[] = ["pending", "approved", "rejected"];
  const escalationLevels: EscalationLevel[] = ["ambient", "awareness", "attention", "action", "urgent"];

  // Get entities that need approval
  const pendingPRs = prs.filter((pr) => pr.status === "pending");
  const pendingPOs = pos.filter((po) => po.status === "pending_approval");
  const pendingInvoices = invoices.filter((inv) => inv.status === "pending_match");

  for (let i = 0; i < count; i++) {
    const entityType = randomItem(["pr", "po", "invoice"] as const);
    let entity: PurchaseRequest | PurchaseOrder | Invoice;
    let amount: number;

    if (entityType === "pr") {
      entity = pendingPRs[i % pendingPRs.length] || prs[i % prs.length];
      amount = (entity as PurchaseRequest).totalEstimatedValue;
    } else if (entityType === "po") {
      entity = pendingPOs[i % pendingPOs.length] || pos[i % pos.length];
      amount = (entity as PurchaseOrder).total;
    } else {
      entity = pendingInvoices[i % pendingInvoices.length] || invoices[i % invoices.length];
      amount = (entity as Invoice).total;
    }

    const requester = randomItem(requesters);
    const status = randomItem(approvalStatuses);
    const now = new Date();

    approvals.push({
      id: uuid(),
      entityType,
      entityId: entity.id,
      requestedBy: requester.id,
      requestedByName: requester.name,
      requestedAt: randomDate(10, 0),
      amount,
      currency: "DKK",
      threshold: 50000,
      status,
      decidedBy: status !== "pending" ? "user-003" : undefined,
      decidedByName: status !== "pending" ? "Lars Pedersen" : undefined,
      decidedAt: status !== "pending" ? randomDate(5, 0) : undefined,
      reason:
        status === "rejected"
          ? randomItem(["Budget exceeded", "Incorrect pricing", "Missing documentation"])
          : undefined,
      comments: status !== "pending" ? "Reviewed and processed" : undefined,
      escalationLevel: randomItem(escalationLevels),
      escalatedAt: Math.random() > 0.7 ? randomDate(3, 0) : undefined,
      createdAt: randomDate(15, 0),
      updatedAt: now,
      syncStatus: "synced" as SyncStatus,
    });
  }

  return approvals;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export interface SeedOptions {
  suppliers?: number;
  purchaseRequests?: number;
  purchaseOrders?: number;
  invoices?: number;
  approvals?: number;
  clearExisting?: boolean;
}

export async function seedDatabase(options: SeedOptions = {}): Promise<void> {
  const {
    suppliers: supplierCount = 15,
    purchaseRequests: prCount = 20,
    purchaseOrders: poCount = 15,
    invoices: invoiceCount = 10,
    approvals: approvalCount = 5,
    clearExisting = true,
  } = options;

  console.log("🌱 Starting database seed...");

  if (clearExisting) {
    console.log("  Clearing existing data...");
    await db.suppliers.clear();
    await db.purchaseRequests.clear();
    await db.purchaseOrders.clear();
    await db.invoices.clear();
    await db.approvals.clear();
    await db.syncQueue.clear();
  }

  // Generate in dependency order
  console.log(`  Generating ${supplierCount} suppliers...`);
  const suppliers = generateSuppliers(supplierCount);
  await db.suppliers.bulkAdd(suppliers);

  console.log(`  Generating ${prCount} purchase requests...`);
  const prs = generatePurchaseRequests(prCount, suppliers);
  await db.purchaseRequests.bulkAdd(prs);

  console.log(`  Generating ${poCount} purchase orders...`);
  const pos = generatePurchaseOrders(poCount, prs, suppliers);
  await db.purchaseOrders.bulkAdd(pos);

  console.log(`  Generating ${invoiceCount} invoices...`);
  const invoices = generateInvoices(invoiceCount, pos, suppliers);
  await db.invoices.bulkAdd(invoices);

  console.log(`  Generating ${approvalCount} approvals...`);
  const approvals = generateApprovals(approvalCount, prs, pos, invoices);
  await db.approvals.bulkAdd(approvals);

  console.log("✅ Database seeded successfully!");
  console.log(`   - ${supplierCount} suppliers`);
  console.log(`   - ${prCount} purchase requests`);
  console.log(`   - ${poCount} purchase orders`);
  console.log(`   - ${invoiceCount} invoices`);
  console.log(`   - ${approvalCount} approvals`);
}

export async function clearDatabase(): Promise<void> {
  console.log("🗑️  Clearing all database tables...");
  await db.suppliers.clear();
  await db.purchaseRequests.clear();
  await db.purchaseOrders.clear();
  await db.invoices.clear();
  await db.approvals.clear();
  await db.feedback.clear();
  await db.changes.clear();
  await db.syncQueue.clear();
  await db.userSettings.clear();
  console.log("✅ Database cleared!");
}

export { db };
