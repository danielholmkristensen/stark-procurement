"use client";

/**
 * STARK Procurement - Dev Tools
 *
 * Development-only component for database seeding and debugging.
 * Hidden in production builds.
 */

import { useState } from "react";
import { seedDatabase, clearDatabase } from "@/lib/db/seed";
import { Button } from "@/components/ui";

interface DevToolsProps {
  position?: "bottom-right" | "bottom-left";
}

export function DevTools({ position = "bottom-right" }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const handleSeed = async () => {
    setIsSeeding(true);
    setMessage(null);
    try {
      await seedDatabase({
        suppliers: 15,
        purchaseRequests: 20,
        purchaseOrders: 15,
        invoices: 18,
        approvals: 12,
        clearExisting: true,
      });
      setMessage("Database seeded successfully!");
      // Reload to show new data
      window.location.reload();
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    setMessage(null);
    try {
      await clearDatabase();
      setMessage("Database cleared!");
      window.location.reload();
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsClearing(false);
    }
  };

  const positionClasses =
    position === "bottom-right" ? "bottom-4 right-4" : "bottom-4 left-4";

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-stark-navy">Dev Tools</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-2">Database Operations</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSeed}
                  disabled={isSeeding || isClearing}
                  size="sm"
                  className="flex-1"
                >
                  {isSeeding ? "Seeding..." : "Seed DB"}
                </Button>
                <Button
                  onClick={handleClear}
                  disabled={isSeeding || isClearing}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {isClearing ? "Clearing..." : "Clear DB"}
                </Button>
              </div>
            </div>

            {message && (
              <p
                className={`text-xs ${
                  message.startsWith("Error") ? "text-stark-orange" : "text-green-700"
                }`}
              >
                {message}
              </p>
            )}

            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Seed: 15 suppliers, 20 PRs, 15 POs, 18 invoices, 12 approvals
              </p>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-stark-navy text-white p-3 rounded-full shadow-lg hover:bg-opacity-90 transition-colors"
          title="Open Dev Tools"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
