import { Header, Footer } from "@/components/layout";
import { KPICard } from "@/components/ui";
import { POPipeline, ActivityFeed, PendingApprovals } from "@/components/domain";
import { EscalationLegend } from "@/components/escalation";

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Active PRs"
              value={127}
              trend={{ value: "+12 today", direction: "neutral" }}
              breakdown={[
                { label: "Relex", value: 89, color: "#001e41" },
                { label: "ECom", value: 38, color: "#334a64" },
              ]}
            />
            <KPICard
              title="POs Pending"
              value={43}
              progress={{ value: 65 }}
              alert={{ count: 3, label: "urgent" }}
            />
            <KPICard
              title="Awaiting Match"
              value={18}
              subtitle="invoices"
            />
            <KPICard
              title="On-time Delivery"
              value="89%"
              trend={{ value: "2%", direction: "up" }}
              progress={{ value: 89 }}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PO Pipeline - spans 2 columns */}
            <div className="lg:col-span-2">
              <POPipeline />
            </div>

            {/* Activity Feed */}
            <div>
              <ActivityFeed />
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="mt-6">
            <PendingApprovals />
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
