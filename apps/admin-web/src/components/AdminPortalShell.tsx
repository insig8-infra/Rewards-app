"use client";

import {
  BarChart3,
  Boxes,
  ClipboardList,
  FileDown,
  Gift,
  Megaphone,
  Printer,
  ReceiptText,
  ShieldCheck,
  Tags,
  LogOut,
  UserCircle,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { createContext, type ReactNode, useContext, useState } from "react";
import type { AdminRole, AdminSessionView } from "../auth/adminSessionTypes";

export type AdminSectionId =
  | "dashboard"
  | "qr-print"
  | "invoices"
  | "print-history"
  | "contractors"
  | "admins"
  | "staff"
  | "profile"
  | "rewards"
  | "reports"
  | "promotions"
  | "item-codes";

interface AdminNavItem {
  readonly id: AdminSectionId;
  readonly label: string;
  readonly href: string;
  readonly icon: LucideIcon;
  readonly roles: readonly AdminRole[];
}

interface AdminActorContextValue {
  readonly actorRole: AdminRole;
  readonly session: AdminSessionView;
}

interface AdminPortalShellProps {
  readonly title: string;
  readonly subtitle: string;
  readonly activeSection: AdminSectionId;
  readonly session: AdminSessionView;
  readonly children: ReactNode;
}

const navItems: readonly AdminNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: BarChart3, roles: ["OWNER", "ADMIN", "STAFF"] },
  { id: "qr-print", label: "Print QR codes", href: "/", icon: Printer, roles: ["OWNER", "ADMIN", "STAFF"] },
  { id: "invoices", label: "Invoice ledger", href: "/invoices", icon: ReceiptText, roles: ["OWNER", "ADMIN", "STAFF"] },
  { id: "print-history", label: "Print history", href: "/print-history", icon: ClipboardList, roles: ["OWNER", "ADMIN", "STAFF"] },
  { id: "contractors", label: "Contractors", href: "/contractors", icon: Users, roles: ["OWNER", "ADMIN", "STAFF"] },
  { id: "admins", label: "Admins", href: "/admins", icon: ShieldCheck, roles: ["OWNER"] },
  { id: "staff", label: "Staff", href: "/staff", icon: UserCog, roles: ["OWNER", "ADMIN"] },
  { id: "profile", label: "My profile", href: "/profile", icon: UserCircle, roles: ["ADMIN", "STAFF"] },
  { id: "rewards", label: "Rewards", href: "/rewards", icon: Gift, roles: ["OWNER", "ADMIN", "STAFF"] },
  { id: "reports", label: "Reports", href: "/reports", icon: FileDown, roles: ["OWNER", "ADMIN", "STAFF"] },
  { id: "promotions", label: "Promotions", href: "/promotions", icon: Megaphone, roles: ["OWNER", "ADMIN"] },
  { id: "item-codes", label: "ItemCodes", href: "/item-codes", icon: Tags, roles: ["OWNER", "ADMIN", "STAFF"] },
];

const AdminActorContext = createContext<AdminActorContextValue | null>(null);

export function AdminPortalShell({ title, subtitle, activeSection, session, children }: AdminPortalShellProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const actorRole = session.role;
  const visibleNavItems = navItems.filter((item) => item.roles.includes(actorRole));

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/session/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/login");
  }

  return (
    <AdminActorContext.Provider value={{ actorRole, session }}>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <Boxes size={18} aria-hidden="true" />
            </div>
            <span>Volt Admin Web Portal</span>
          </div>
          <nav className="nav" aria-label="Admin web">
            {visibleNavItems.map((item) => (
              <AdminNavLink
                active={item.id === activeSection || pathname === item.href}
                item={item}
                key={item.id}
              />
            ))}
          </nav>
        </aside>

        <main className="main">
          <header className="topbar">
            <div>
              <h1>{title}</h1>
              <div className="status">
                Welcome, {session.actorName ?? session.roleLabel} | {subtitle}
              </div>
            </div>
            <div className="toolbar">
              <span className="badge good">
                <ShieldCheck size={14} aria-hidden="true" />
                {session.actorLabel}
              </span>
              <button className="button compact" type="button" disabled={loggingOut} onClick={() => void logout()}>
                <LogOut size={15} aria-hidden="true" />
                Logout
              </button>
            </div>
            <nav className="mobile-nav" aria-label="Admin web mobile">
              {visibleNavItems.map((item) => (
                <Link
                  aria-current={item.id === activeSection ? "page" : undefined}
                  className={`mobile-nav-link ${item.id === activeSection ? "active" : ""}`}
                  href={item.href as Route}
                  key={item.id}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          {children}
        </main>
      </div>
    </AdminActorContext.Provider>
  );
}

export function useAdminActor(): AdminActorContextValue {
  const context = useContext(AdminActorContext);

  if (!context) {
    throw new Error("useAdminActor must be used inside AdminPortalShell");
  }

  return context;
}

function AdminNavLink({ active, item }: { readonly active: boolean; readonly item: AdminNavItem }) {
  const Icon = item.icon;

  return (
    <Link aria-current={active ? "page" : undefined} className={`nav-item ${active ? "active" : ""}`} href={item.href as Route}>
      <Icon size={18} aria-hidden="true" />
      {item.label}
    </Link>
  );
}
