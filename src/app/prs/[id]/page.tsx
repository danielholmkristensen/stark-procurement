"use client";

import { use } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { PRDetail } from "@/components/pr/PRDetail";

interface PRDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PRDetailPage({ params }: PRDetailPageProps) {
  const { id } = use(params);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/prs" className="hover:text-stark-navy">← Back to PRs</Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">A2</span>
              <h1 className="text-2xl font-bold text-stark-navy">PR Detail</h1>
            </div>
          </div>

          <PRDetail prId={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
