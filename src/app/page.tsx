import { Header, Footer } from "@/components/layout";
import {
  POPipeline,
  ActivityFeed,
  MorningBriefing,
  ActionItemsPanel,
  MyWorkload,
  AutomationReport,
} from "@/components/domain";

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Morning Briefing - 3 Action-Enabling Questions */}
          <MorningBriefing />

          {/* Handle Now - Exceptions Requiring Human Judgment */}
          <div className="mb-6">
            <ActionItemsPanel />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PO Pipeline - spans 2 columns */}
            <div className="lg:col-span-2">
              <POPipeline />
            </div>

            {/* Right Column: Queue + Automation + Activity */}
            <div className="space-y-6">
              <MyWorkload />
              <AutomationReport />
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
