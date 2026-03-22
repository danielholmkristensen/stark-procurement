"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { InvoiceList } from "@/components/invoice";
import { Button } from "@/components/ui";

export default function InvoicesPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">D1</span>
              <h1 className="text-2xl font-bold text-stark-navy">Invoices</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/invoices/match-results">
                <Button variant="outline" size="sm">Match Results</Button>
              </Link>
              <Link href="/invoices/discrepancies">
                <Button variant="outline" size="sm">Discrepancy Queue</Button>
              </Link>
            </div>
          </div>
          <InvoiceList />
        </div>
      </main>
      <Footer />
    </>
  );
}
