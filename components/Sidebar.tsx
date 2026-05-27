"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import { useTheme } from "@/lib/theme";

const navItems = [
  { href: "/",          label: "Dashboard",      icon: "⬛" },
  { href: "/patients",  label: "Patients",        icon: "👤" },
  { href: "/outreach",  label: "Outreach Queue",  icon: "📞", badge: true },
  { href: "/protocols", label: "Protocols",       icon: "💊" },
  { href: "/import",    label: "CSV Import",      icon: "📂" },
  { href: "/audit",     label: "Audit Log",       icon: "📋" },
  { href: "/reports",   label: "Reports",         icon: "📈" },
  { href: "/settings",  label: "Settings",        icon: "⚙️" },
];

export default function Sidebar({ session }: { session: Session | null }) {
  const pathname = usePathname();
  const [urgentCount, setUrgentCount] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/outreach/count")
      .then((r) => r.json())
      .then((d) => setUrgentCount(d.urgent ?? 0))
      .catch(() => {});
  }, []);

  const { theme, toggleTheme } = useTheme();
  const userName = session?.user?.name ?? "Practice Staff";
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "STAFF";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      style={{ background: "var(--sidebar-bg)" }}
      className="fixed left-0 top-0 h-full w-64 flex flex-col z-10"
    >
      {/* Logo */}
      <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid var(--sidebar-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icon mark — C arc + heart */}
          <div style={{ width: 34, height: 34, flexShrink: 0 }}>
            <svg viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17 2 A15 15 0 1 0 3 20"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M17 2 A15 15 0 0 1 30 22"
                stroke="#10B5A6"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="17" cy="2"  r="2" fill="#2563EB" />
              <circle cx="30" cy="22" r="2" fill="#10B981" />
              <path
                d="M17 21 C17 21 12 17.5 12 14.5 C12 12.5 13.5 11 15.5 11 C16.3 11 17 11.6 17 11.6 C17 11.6 17.7 11 18.5 11 C20.5 11 22 12.5 22 14.5 C22 17.5 17 21 17 21Z"
                fill="#10B5A6"
              />
            </svg>
          </div>

          {/* Wordmark */}
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontFamily: "var(--font-sora)",
              }}
            >
              <span style={{ color: "#ffffff" }}>Clini</span>
              <span style={{ color: "#10B5A6" }}>vore</span>
            </div>
            <div
              style={{
                fontSize: 10,
                marginTop: 2,
                color: "var(--sidebar-muted)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Treatment Continuity
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const isHovered = hovered === item.href && !isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHovered(item.href)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 20px",
                borderLeft: isActive
                  ? "2px solid #2563EB"
                  : "2px solid transparent",
                background: isActive
                  ? "rgba(37,99,235,0.15)"
                  : isHovered
                  ? "rgba(255,255,255,0.05)"
                  : "transparent",
                color: isActive
                  ? "#ffffff"
                  : isHovered
                  ? "rgba(255,255,255,0.85)"
                  : "rgba(255,255,255,0.55)",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                fontFamily: "var(--font-inter)",
                textDecoration: "none",
                transition: "all 0.1s",
                boxSizing: "border-box",
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && urgentCount > 0 && (
                <span
                  style={{
                    background: "#DC2626",
                    color: "#ffffff",
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 20,
                    padding: "2px 6px",
                    minWidth: 20,
                    textAlign: "center",
                    lineHeight: "16px",
                  }}
                >
                  {urgentCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div style={{ padding: "0 12px 12px" }}>
        <button
          onClick={toggleTheme}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "9px 12px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            cursor: "pointer",
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            fontFamily: "var(--font-inter)",
            fontWeight: 500,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(255,255,255,0.85)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}
        >
          <span style={{ fontSize: 14 }}>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>
      </div>

      {/* HIPAA badge */}
      <div
        style={{
          margin: "0 12px 12px",
          padding: "10px 13px",
          background: "rgba(16,181,166,0.1)",
          border: "1px solid rgba(16,181,166,0.2)",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#10B5A6",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          🔒 HIPAA-Aware
        </div>
        <div style={{ fontSize: 10, color: "var(--sidebar-muted)", marginTop: 2 }}>
          Secure & Compliant
        </div>
      </div>

      {/* User footer */}
      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--sidebar-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "rgba(16,181,166,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#10B5A6",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#ffffff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </div>
            <div style={{ fontSize: 10, color: "var(--sidebar-muted)" }}>
              {userRole} · Phase 1 MVP
            </div>
          </div>
          {session && (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                color: "var(--sidebar-muted)",
                padding: 0,
                transition: "color 0.1s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--sidebar-muted)")}
              title="Sign out"
            >
              →
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
