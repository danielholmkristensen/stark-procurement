"use client";

import { Header, Footer } from "@/components/layout";
import { PRList } from "@/components/pr/PRList";

export default function PRListPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">A1</span>
            <h1 className="text-2xl font-bold text-stark-navy">Purchase Requests</h1>
          </div>

          <PRList />
        </div>
      </main>
      <Footer />
    </>
  );
}
