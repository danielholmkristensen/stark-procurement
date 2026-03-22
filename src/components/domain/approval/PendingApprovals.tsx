"use client";

import { Card, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import Link from "next/link";

type ApprovalType = "invoice" | "po";
type ApprovalStatus = "discrepancy" | "matched" | "threshold";

interface ApprovalItem {
  id: string;
  type: ApprovalType;
  supplier: string;
  value: string;
  status: ApprovalStatus;
  statusLabel: string;
}

const mockApprovals: ApprovalItem[] = [
  {
    id: "INV-4518",
    type: "invoice",
    supplier: "Supplier XYZ",
    value: "€12,340",
    status: "discrepancy",
    statusLabel: "Qty discrepancy",
  },
  {
    id: "INV-4516",
    type: "invoice",
    supplier: "Supplier DEF",
    value: "€8,920",
    status: "matched",
    statusLabel: "Matched",
  },
  {
    id: "PO-2026-0848",
    type: "po",
    supplier: "Budget exception",
    value: "€45,000",
    status: "threshold",
    statusLabel: "Over threshold",
  },
];

export function PendingApprovals() {
  const count = mockApprovals.length;

  return (
    <Card>
      <CardHeader
        action={
          <Link href="/approvals" className="text-xs text-stark-navy hover:underline">
            View all
          </Link>
        }
      >
        <CardTitle>Pending Approvals</CardTitle>
        <Badge variant="count">{count}</Badge>
      </CardHeader>
      <div className="divide-y divide-gray-50">
        {mockApprovals.map((item) => (
          <ApprovalRow key={item.id} item={item} />
        ))}
      </div>
    </Card>
  );
}

function ApprovalRow({ item }: { item: ApprovalItem }) {
  const needsAttention = item.status === "discrepancy" || item.status === "threshold";

  return (
    <div
      className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 ${
        needsAttention ? "border-l-2 border-stark-orange" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <ApprovalIcon type={item.type} />
        <div>
          <p className="text-sm font-medium text-stark-navy">{item.id}</p>
          <p className="text-xs text-gray-400">
            {item.supplier} · {item.value}
          </p>
        </div>
        <ApprovalStatusLabel status={item.status} label={item.statusLabel} />
      </div>
      <div className="flex items-center gap-2">
        {needsAttention ? (
          <Button variant="action" size="sm">
            Review
          </Button>
        ) : (
          <Button variant="primary" size="sm">
            Approve
          </Button>
        )}
      </div>
    </div>
  );
}

function ApprovalIcon({ type }: { type: ApprovalType }) {
  return (
    <div className="w-10 h-10 rounded-lg bg-stark-navy-10 flex items-center justify-center">
      {type === "invoice" ? (
        <DocumentIcon className="w-5 h-5 text-stark-navy" />
      ) : (
        <ClipboardIcon className="w-5 h-5 text-stark-navy" />
      )}
    </div>
  );
}

function ApprovalStatusLabel({
  status,
  label,
}: {
  status: ApprovalStatus;
  label: string;
}) {
  if (status === "matched") {
    return (
      <span className="ml-2 flex items-center gap-1 text-xs text-green-600">
        <CheckCircleIcon />
        {label}
      </span>
    );
  }

  return <span className="ml-2 text-xs text-stark-orange">{label}</span>;
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
