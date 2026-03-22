"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui";

type ActivityType = "send" | "match" | "ingest" | "alert";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  time: string;
  attention?: boolean;
}

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "send",
    title: "PO sent to Supplier ABC",
    subtitle: "via EDI · 2m ago",
    time: "2m ago",
  },
  {
    id: "2",
    type: "match",
    title: "Invoice INV-4521 matched",
    subtitle: "2-way match successful · 5m ago",
    time: "5m ago",
  },
  {
    id: "3",
    type: "ingest",
    title: "PR ingested from Relex",
    subtitle: "15 items · €8,340 · 8m ago",
    time: "8m ago",
  },
  {
    id: "4",
    type: "alert",
    title: "Discrepancy flagged",
    subtitle: "INV-4518 · Qty mismatch · 12m ago",
    time: "12m ago",
    attention: true,
  },
];

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader
        action={<span className="w-2 h-2 bg-stark-navy rounded-full" />}
      >
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <div className="divide-y divide-gray-50 max-h-[340px] overflow-y-auto scrollbar-thin">
        {mockActivities.map((activity) => (
          <ActivityRow key={activity.id} activity={activity} />
        ))}
      </div>
    </Card>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  return (
    <div
      className={`px-5 py-3 hover:bg-gray-50 cursor-pointer ${
        activity.attention ? "border-l-2 border-stark-orange" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <ActivityIcon type={activity.type} attention={activity.attention} />
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm text-stark-navy ${
              activity.attention ? "font-medium" : ""
            }`}
          >
            {activity.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{activity.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({
  type,
  attention,
}: {
  type: ActivityType;
  attention?: boolean;
}) {
  const bgColor = attention
    ? "bg-stark-orange/10"
    : type === "match"
    ? "bg-green-50"
    : "bg-stark-navy-10";

  const iconColor = attention
    ? "text-stark-orange"
    : type === "match"
    ? "text-green-600"
    : "text-stark-navy";

  return (
    <div
      className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}
    >
      {type === "send" && <SendIcon className={`w-4 h-4 ${iconColor}`} />}
      {type === "match" && <CheckIcon className={`w-4 h-4 ${iconColor}`} />}
      {type === "ingest" && <UploadIcon className={`w-4 h-4 ${iconColor}`} />}
      {type === "alert" && <AlertIcon className={`w-4 h-4 ${iconColor}`} />}
    </div>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
