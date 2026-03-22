"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { ApprovalHistory } from "@/components/approval";

export default function ApprovalHistoryPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/approvals" className="hover:text-stark-navy">← Back to Queue</Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">E2</span>
              <h1 className="text-2xl font-bold text-stark-navy">Approval History</h1>
            </div>
          </div>
          <ApprovalHistory />
        </div>
      </main>
      <Footer />
    </>
  );
}
