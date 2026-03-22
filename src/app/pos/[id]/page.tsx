"use client";

import { use } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { PODetail } from "@/components/po";

interface PODetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PODetailPage({ params }: PODetailPageProps) {
  const { id } = use(params);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/pos" className="hover:text-stark-navy">← Back to POs</Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">B2</span>
              <h1 className="text-2xl font-bold text-stark-navy">PO Detail</h1>
            </div>
          </div>
          <PODetail poId={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
