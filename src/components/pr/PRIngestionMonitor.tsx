"use client";

/**
 * PR Ingestion Monitor Component (Screen A4)
 *
 * Shows real-time status of PR ingestion sources
 * and activity feed of recent PR imports.
 */

import { useMemo } from "react";
import { usePurchaseRequests } from "@/hooks";
import { Badge, LiveIndicator, StatusIndicator } from "@/components/ui";
import type { PRSource } from "@/lib/db";

interface SourceStatus {
  source: PRSource;
  label: string;
  status: "online" | "offline" | "toggle-off";
  lastSync: string;
  isLive: boolean;
}

interface ActivityItem {
  id: string;
  timestamp: string;
  source: PRSource;
  message: string;
  status: "success" | "error" | "warning";
}

export function PRIngestionMonitor() {
  const allPRs = usePurchaseRequests();

  // Source status configuration
  const sourceStatuses: SourceStatus[] = [
    {
      source: "relex",
      label: "Relex",
      status: "online",
      lastSync: "2m ago",
      isLive: true,
    },
    {
      source: "ecom",
      label: "ECom",
      status: "online",
      lastSync: "5m ago",
      isLive: true,
    },
    {
      source: "manual",
      label: "Aspect4",
      status: "online",
      lastSync: "1m ago",
      isLive: false,
    },
    {
      source: "salesapp",
      label: "SalesApp",
      status: "toggle-off",
      lastSync: "Feature flagged",
      isLive: false,
    },
  ];

  // Generate activity from recent PRs
  const activities = useMemo<ActivityItem[]>(() => {
    if (!allPRs) return [];

    // Get most recent PRs and create activity items
    const recentPRs = [...allPRs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return recentPRs.map((pr) => {
      const date = new Date(pr.createdAt);
      const timeStr = date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      return {
        id: pr.id,
        timestamp: timeStr,
        source: pr.source,
        message: `Ingested ${pr.prNumber} (${pr.lineItems.length} items, ${formatCurrency(pr.totalEstimatedValue)})`,
        status: "success" as const,
      };
    });
  }, [allPRs]);

  // Format currency
  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Get status color
  const getStatusColor = (status: "online" | "offline" | "toggle-off") => {
    switch (status) {
      case "online":
        return "text-green-600";
      case "offline":
        return "text-red-600";
      case "toggle-off":
        return "text-amber-600";
    }
  };

  // Get status label
  const getStatusLabel = (status: "online" | "offline" | "toggle-off") => {
    switch (status) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      case "toggle-off":
        return "Toggle Off";
    }
  };

  // Get source label
  const getSourceLabel = (source: PRSource): string => {
    const labels: Record<PRSource, string> = {
      relex: "Relex",
      ecom: "ECom",
      salesapp: "SalesApp",
      manual: "Aspect4",
    };
    return labels[source];
  };

  if (!allPRs) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-pulse text-gray-400">Loading ingestion monitor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Source Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sourceStatuses.map((source) => (
          <div key={source.source} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              {source.status === "online" && source.isLive ? (
                <LiveIndicator />
              ) : (
                <StatusIndicator
                  status={source.status === "online" ? "online" : source.status === "toggle-off" ? "toggle" : "offline"}
                />
              )}
              <span className="text-sm font-medium text-gray-700">{source.label}</span>
            </div>
            <p className={`text-2xl font-bold ${getStatusColor(source.status)}`}>
              {getStatusLabel(source.status)}
            </p>
            <p className="text-xs text-gray-500">Last sync: {source.lastSync}</p>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Ingestion Activity</h3>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live
          </span>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="px-4 py-3 flex items-center gap-4">
                <span className="text-xs text-gray-400 w-20 font-mono">
                  {activity.timestamp}
                </span>
                <Badge variant="source">{getSourceLabel(activity.source)}</Badge>
                <span className="text-sm flex-1">{activity.message}</span>
                <span
                  className={`ml-auto text-xs ${
                    activity.status === "success"
                      ? "text-green-600"
                      : activity.status === "error"
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                >
                  {activity.status === "success"
                    ? "Success"
                    : activity.status === "error"
                    ? "Error"
                    : "Warning"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ingestion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Today&apos;s Ingestions</h4>
          <p className="text-2xl font-bold text-gray-900">{allPRs.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Success Rate</h4>
          <p className="text-2xl font-bold text-green-600">100%</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-1">Avg Processing Time</h4>
          <p className="text-2xl font-bold text-gray-900">&lt; 1s</p>
        </div>
      </div>
    </div>
  );
}
