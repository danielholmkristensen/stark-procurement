/**
 * Morning Briefing Component
 *
 * Answers 3 questions in 10 seconds:
 * 1. Spend Today - vs budget
 * 2. Pipeline - PRs and total value
 * 3. Action Now - Urgent and total action items
 */

"use client";

import { useMemo } from "react";
import { TrendingUp, FileStack, AlertCircle } from "lucide-react";
import { usePurchaseRequests, usePurchaseOrders, useApprovals } from "@/hooks";
import type { EscalationLevel } from "@/lib/db";

export function MorningBriefing() {
  const allPRs = usePurchaseRequests();
  const allPOs = usePurchaseOrders();
  const allApprovals = useApprovals();

  // Calculate metrics
  const metrics = useMemo(() => {
    // Spend Today (POs sent or confirmed today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const spendToday = (allPOs || [])
      .filter((po) => {
        if (!po.sentAt) return false;
        const sentDate = new Date(po.sentAt);
        sentDate.setHours(0, 0, 0, 0);
        return sentDate.getTime() === today.getTime();
      })
      .reduce((sum, po) => sum + po.total, 0);

    // Pipeline - Active PRs and their value
    const activePRs = (allPRs || []).filter(
      (pr) => pr.status === "pending" || pr.status === "approved"
    );
    const pipelineCount = activePRs.length;
    const pipelineValue = activePRs.reduce((sum, pr) => sum + pr.totalEstimatedValue, 0);

    // Action items - items requiring action
    const urgentEscalations: EscalationLevel[] = ["urgent", "action"];

    const urgentPRs = (allPRs || []).filter(
      (pr) => urgentEscalations.includes(pr.escalationLevel) && pr.status !== "converted" && pr.status !== "rejected"
    ).length;

    const urgentPOs = (allPOs || []).filter(
      (po) => urgentEscalations.includes(po.escalationLevel) && po.status !== "completed" && po.status !== "cancelled"
    ).length;

    const pendingApprovals = (allApprovals || []).filter(
      (a) => a.status === "pending"
    ).length;

    const urgentCount = urgentPRs + urgentPOs;
    const totalActionItems = urgentCount + pendingApprovals;

    return {
      spendToday,
      pipelineCount,
      pipelineValue,
      urgentCount,
      totalActionItems,
    };
  }, [allPRs, allPOs, allApprovals]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `DKK ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `DKK ${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("da-DK", {
      style: "currency",
      currency: "DKK",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-stark-navy uppercase tracking-wide">
          Morning Briefing
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Spend Today */}
        <BriefingCard
          icon={<TrendingUp size={20} />}
          title="Spend Today"
          value={formatCurrency(metrics.spendToday)}
          subtitle="vs budget"
          variant="neutral"
        />

        {/* Pipeline */}
        <BriefingCard
          icon={<FileStack size={20} />}
          title="Pipeline"
          value={`${metrics.pipelineCount} PRs`}
          subtitle={formatCurrency(metrics.pipelineValue)}
          variant="neutral"
        />

        {/* Action Now */}
        <BriefingCard
          icon={<AlertCircle size={20} />}
          title="Action Now"
          value={`${metrics.urgentCount} Urgent`}
          subtitle={`${metrics.totalActionItems} Total`}
          variant={metrics.urgentCount > 0 ? "alert" : "neutral"}
        />
      </div>
    </div>
  );
}

interface BriefingCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  variant: "neutral" | "alert";
}

function BriefingCard({ icon, title, value, subtitle, variant }: BriefingCardProps) {
  const iconColor = variant === "alert" ? "text-stark-orange" : "text-stark-navy";
  const valueColor = variant === "alert" ? "text-stark-orange" : "text-stark-navy";

  return (
    <div className="px-5 py-4 flex items-center gap-4">
      <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{title}</p>
        <p className={`text-xl font-bold ${valueColor}`}>{value}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}
