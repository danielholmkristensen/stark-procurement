"use client";

import { Card, CardHeader, CardTitle, LiveIndicator } from "@/components/ui";

interface POItem {
  id: string;
  supplier?: string;
  items?: number;
  value?: string;
  eta?: string;
  status?: "on_track" | "delayed" | "complete";
  sentAgo?: string;
}

interface PipelineStage {
  name: string;
  count: number;
  items: POItem[];
}

const mockPipeline: PipelineStage[] = [
  {
    name: "Draft",
    count: 12,
    items: [
      { id: "PO-2026-0851", items: 3, value: "€4,230" },
      { id: "PO-2026-0850", items: 7, value: "€12,450" },
    ],
  },
  {
    name: "Sent",
    count: 23,
    items: [{ id: "PO-2026-0847", supplier: "Supplier ABC", sentAgo: "2m ago" }],
  },
  {
    name: "Confirmed",
    count: 8,
    items: [{ id: "PO-2026-0842", eta: "Mar 25", status: "on_track" }],
  },
  {
    name: "Received",
    count: 156,
    items: [{ id: "PO-2026-0839", status: "complete" }],
  },
];

export function POPipeline() {
  return (
    <Card>
      <CardHeader action={<LiveIndicator />}>
        <CardTitle>PO Pipeline</CardTitle>
      </CardHeader>
      <div className="p-5">
        <div className="grid grid-cols-4 gap-3">
          {mockPipeline.map((stage) => (
            <PipelineStage key={stage.name} stage={stage} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function PipelineStage({ stage }: { stage: PipelineStage }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-stark-navy">{stage.name}</span>
        <span className="text-xs text-gray-400">{stage.count}</span>
      </div>
      <div className="space-y-2">
        {stage.items.map((item) => (
          <POCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function POCard({ item }: { item: POItem }) {
  return (
    <div className="bg-white rounded-lg border border-gray-150 p-3 hover:border-stark-navy/30 transition-colors cursor-pointer">
      <div className="text-xs font-medium text-stark-navy">{item.id}</div>
      {item.items && item.value && (
        <div className="text-[11px] text-gray-400 mt-1">
          {item.items} items · {item.value}
        </div>
      )}
      {item.supplier && (
        <div className="text-[11px] text-gray-400 mt-1">{item.supplier}</div>
      )}
      {item.sentAgo && (
        <div className="text-[11px] text-stark-navy mt-1">Sent {item.sentAgo}</div>
      )}
      {item.eta && (
        <div className="text-[11px] text-gray-400 mt-1">ETA: {item.eta}</div>
      )}
      {item.status === "on_track" && (
        <div className="flex items-center gap-1 text-[11px] text-green-600 mt-1">
          <CheckIcon />
          On track
        </div>
      )}
      {item.status === "complete" && (
        <>
          <div className="text-[11px] text-gray-400 mt-1">Complete</div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
            <CheckCircleIcon />
            Matched
          </div>
        </>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
