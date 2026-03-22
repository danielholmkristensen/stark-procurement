"use client";

import { use } from "react";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { InvoiceDetail } from "@/components/invoice";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = use(params);

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Link href="/invoices" className="hover:text-stark-navy">← Back to Invoices</Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">D2</span>
              <h1 className="text-2xl font-bold text-stark-navy">Invoice Detail</h1>
            </div>
          </div>
          <InvoiceDetail invoiceId={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
