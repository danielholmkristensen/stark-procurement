"use client";

/**
 * PR Sources Dashboard Component (Screen A3)
 *
 * Shows distribution of PRs across different sources
 * with source cards, progress bars, and a donut chart.
 */

import { useMemo } from "react";
import { usePurchaseRequests } from "@/hooks";
import { Badge } from "@/components/ui";
import type { PRSource } from "@/lib/db";

interface SourceStats {
  source: PRSource;
  label: string;
  count: number;
  percentage: number;
  value: number;
  color: string;
  chartColor: string;
}

export function PRSourcesDashboard() {
  const allPRs = usePurchaseRequests();

  // Calculate source statistics
  const sourceStats = useMemo<SourceStats[]>(() => {
    if (!allPRs || allPRs.length === 0) return [];

    const stats: Record<PRSource, { count: number; value: number }> = {
      relex: { count: 0, value: 0 },
      ecom: { count: 0, value: 0 },
      salesapp: { count: 0, value: 0 },
      manual: { count: 0, value: 0 },
    };

    allPRs.forEach((pr) => {
      stats[pr.source].count++;
      stats[pr.source].value += pr.totalEstimatedValue;
    });

    const total = allPRs.length;

    return ([
      {
        source: "relex" as PRSource,
        label: "Relex",
        count: stats.relex.count,
        percentage: total > 0 ? (stats.relex.count / total) * 100 : 0,
        value: stats.relex.value,
        color: "bg-stark-navy",
        chartColor: "#001e41",
      },
      {
        source: "ecom" as PRSource,
        label: "ECom",
        count: stats.ecom.count,
        percentage: total > 0 ? (stats.ecom.count / total) * 100 : 0,
        value: stats.ecom.value,
        color: "bg-stark-navy-light",
        chartColor: "#0a2d52",
      },
      {
        source: "salesapp" as PRSource,
        label: "SalesApp",
        count: stats.salesapp.count,
        percentage: total > 0 ? (stats.salesapp.count / total) * 100 : 0,
        value: stats.salesapp.value,
        color: "bg-stark-orange",
        chartColor: "#f08b1d",
      },
      {
        source: "manual" as PRSource,
        label: "Manual",
        count: stats.manual.count,
        percentage: total > 0 ? (stats.manual.count / total) * 100 : 0,
        value: stats.manual.value,
        color: "bg-gray-400",
        chartColor: "#9ca3af",
      },
    ] as SourceStats[]).filter((s) => s.count > 0);
  }, [allPRs]);

  const totalPRs = allPRs?.length || 0;
  const totalValue = allPRs?.reduce((sum, pr) => sum + pr.totalEstimatedValue, 0) || 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate SVG donut chart segments
  const donutSegments = useMemo(() => {
    const segments: Array<{ offset: number; length: number; color: string }> = [];
    let offset = 0;
    const circumference = 2 * Math.PI * 40;

    sourceStats.forEach((stat) => {
      const length = (stat.percentage / 100) * circumference;
      segments.push({
        offset: -offset,
        length,
        color: stat.chartColor,
      });
      offset += length;
    });

    return segments;
  }, [sourceStats]);

  if (!allPRs) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-pulse text-gray-400">Loading source statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sourceStats.map((stat) => (
          <div key={stat.source} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="source">{stat.label}</Badge>
              <span className="text-2xl font-bold text-gray-900">{stat.count}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                style={{ width: `${stat.percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{stat.percentage.toFixed(0)}% of total PRs</p>
            <p className="text-sm text-gray-500">{formatCurrency(stat.value)} value</p>
          </div>
        ))}
      </div>

      {/* Donut Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Source Distribution</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {donutSegments.map((segment, index) => (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="20"
                  strokeDasharray={`${segment.length} ${2 * Math.PI * 40}`}
                  strokeDashoffset={segment.offset}
                  className="transition-all duration-500"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-3xl font-bold text-gray-900">{totalPRs}</span>
                <p className="text-sm text-gray-500">Total PRs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6">
          {sourceStats.map((stat) => (
            <div key={stat.source} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stat.chartColor }}
              />
              <span className="text-sm text-gray-600">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Total PRs</span>
            <p className="text-xl font-bold text-gray-900">{totalPRs}</p>
          </div>
          <div>
            <span className="text-gray-500 block">Total Value</span>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
          </div>
          <div>
            <span className="text-gray-500 block">Primary Source</span>
            <p className="text-xl font-bold text-gray-900">
              {sourceStats.length > 0 ? sourceStats[0].label : "—"}
            </p>
          </div>
          <div>
            <span className="text-gray-500 block">Avg PR Value</span>
            <p className="text-xl font-bold text-gray-900">
              {totalPRs > 0 ? formatCurrency(totalValue / totalPRs) : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
