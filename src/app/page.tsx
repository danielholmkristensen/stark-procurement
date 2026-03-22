import { Header, Footer } from "@/components/layout";
import {
  POPipeline,
  ActivityFeed,
  MorningBriefing,
  ActionItemsPanel,
  MyWorkload,
} from "@/components/domain";
import { EscalationLegend } from "@/components/escalation";

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Morning Briefing - 3 Questions in 10 Seconds */}
          <MorningBriefing />

          {/* Action Items - Urgent/Attention Grouped */}
          <div className="mb-6">
            <ActionItemsPanel />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PO Pipeline - spans 2 columns */}
            <div className="lg:col-span-2">
              <POPipeline />
            </div>

            {/* My Workload + Activity Feed */}
            <div className="space-y-6">
              <MyWorkload />
              <ActivityFeed />
            </div>
          </div>

          {/* Escalation Hierarchy Legend */}
          <div className="mt-6">
            <EscalationLegend />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
