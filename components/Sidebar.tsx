"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";

const navItems = [
  { href: "/", label: "Dashboard", icon: "⬛" },
  { href: "/patients", label: "Patients", icon: "👤" },
  { href: "/outreach", label: "Outreach Queue", icon: "📞", badge: true },
  { href: "/protocols", label: "Protocols", icon: "💊" },
  { href: "/import", label: "CSV Import", icon: "📂" },
  { href: "/audit", label: "Audit Log", icon: "📋" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    fetch("/api/outreach/count")
      .then((r) => r.json())
      .then((d) => setUrgentCount(d.urgent ?? 0))
      .catch(() => {});
  }, []);

  const userName = session?.user?.name ?? "Practice Staff";
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "STAFF";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-10">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            Cv
          </div>
          <div>
            <div className="font-semibold text-sm">
              <span className="text-blue-400">clini</span><span className="text-white">vore</span>
            </div>
            <div className="text-slate-400 text-xs">Treatment Continuity</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && urgentCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
                  {urgentCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700">
        <div className="text-xs text-slate-500 mb-2">
          <div className="font-medium text-slate-400">{userName}</div>
          <div>{userRole} · Phase 1 MVP</div>
        </div>
        {session && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
          >
            Sign out →
          </button>
        )}
      </div>
    </aside>
  );
}
