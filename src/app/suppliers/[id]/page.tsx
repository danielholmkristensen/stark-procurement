"use client";

import { use } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { SupplierDetail } from "@/components/supplier";

interface SupplierDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = use(params);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/suppliers" className="hover:text-stark-navy">← Back to Suppliers</Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">C2</span>
              <h1 className="text-2xl font-bold text-stark-navy">Supplier Detail</h1>
            </div>
          </div>
          <SupplierDetail supplierId={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
