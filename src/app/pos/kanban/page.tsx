"use client";

import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { POKanban } from "@/components/po";
import { Button } from "@/components/ui";

export default function POKanbanPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-stark-navy text-white text-xs font-bold rounded">B5</span>
              <h1 className="text-2xl font-bold text-stark-navy">PO Status Kanban</h1>
            </div>
            <Link href="/pos">
              <Button variant="outline" size="sm">Switch to List View</Button>
            </Link>
          </div>
          <POKanban />
        </div>
      </main>
      <Footer />
    </>
  );
}
