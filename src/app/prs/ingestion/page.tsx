"use client";

import { Header, Footer } from "@/components/layout";
import { PRIngestionMonitor } from "@/components/pr";

export default function IngestionMonitorPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">A4</span>
            <h1 className="text-2xl font-bold text-stark-navy">PR Ingestion Monitor</h1>
          </div>

          <PRIngestionMonitor />
        </div>
      </main>
      <Footer />
    </>
  );
}
