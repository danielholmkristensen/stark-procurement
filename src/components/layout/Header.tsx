"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/", badge: null },
  { name: "PRs", href: "/prs", badge: null },
  { name: "POs", href: "/pos", badge: null },
  { name: "Invoices", href: "/invoices", badge: 18 },
  { name: "Suppliers", href: "/suppliers", badge: null },
  { name: "Approvals", href: "/approvals", badge: 3 },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-stark-navy sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-base font-semibold text-white">STARK</span>
          <nav className="flex items-center">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-4 text-sm border-b-2 -mb-[1px] relative transition-colors ${
                    isActive
                      ? "font-medium text-white border-stark-orange"
                      : "text-white/70 hover:text-white border-transparent"
                  }`}
                >
                  {item.name}
                  {item.badge && (
                    <span className="absolute top-2.5 -right-1 min-w-[16px] h-4 px-1 bg-white/20 text-white text-[10px] font-medium rounded flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors">
            <SearchIcon />
          </button>
          <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white relative transition-colors">
            <NotificationIcon />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-white rounded-full" />
          </button>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium text-white cursor-pointer ml-1">
            DK
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
