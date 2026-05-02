import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LayoutDashboard, BookOpen, Clock, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineBanner } from "@/components/offline-banner";
import { SidebarLogo, MobileLogoMark } from "@/components/logo";
import { NetworkStatusPill } from "@/components/network-status-pill";

const navGroups = [
  {
    label: "My Learning",
    items: [
      { name: "Dashboard", href: "/student", icon: LayoutDashboard },
      { name: "Subjects", href: "/student/subjects", icon: BookOpen },
      { name: "Attendance", href: "/student/attendance", icon: Clock },
    ],
  },
];

const SIDEBAR_BG = "#0B2819";
const SIDEBAR_ACTIVE_BG = "rgba(255,255,255,0.08)";
const SIDEBAR_HOVER_BG = "rgba(255,255,255,0.04)";

export function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const initials = user?.fullName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "S";

  const isActive = (href: string) =>
    href === "/student" ? location === href : location.startsWith(href);

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ backgroundColor: "#f4f4f0" }}>
      <div className="md:hidden flex items-center justify-between px-4 py-3" style={{ backgroundColor: SIDEBAR_BG }}>
        <MobileLogoMark />
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:bg-white/10">
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className={`${isMobileMenuOpen ? "flex" : "hidden"} md:flex flex-col w-full md:w-56 flex-shrink-0`} style={{ backgroundColor: SIDEBAR_BG }}>
        <div className="hidden md:flex items-center px-5 py-[22px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <SidebarLogo portalLabel="Student Portal" />
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2.5" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#3d6650", padding: "0 10px", marginBottom: "4px", textTransform: "uppercase" }}>{group.label}</p>
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      onClick={() => setIsMobileMenuOpen(false)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 10px", borderRadius: "7px", cursor: "pointer", transition: "all 0.12s", backgroundColor: active ? SIDEBAR_ACTIVE_BG : "transparent", marginBottom: "1px", position: "relative" }}
                      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = SIDEBAR_HOVER_BG; }}
                      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
                    >
                      {active && <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "3px", height: "18px", backgroundColor: "#4ade80", borderRadius: "0 2px 2px 0" }} />}
                      <item.icon style={{ width: "15px", height: "15px", flexShrink: 0, color: active ? "#a7f3d0" : "#4d7a62" }} />
                      <span style={{ fontSize: "13.5px", fontWeight: active ? 600 : 500, color: active ? "#ffffff" : "#7da890", flex: 1 }}>{item.name}</span>
                      {active && <ChevronRight style={{ width: "12px", height: "12px", color: "#4d7a62", flexShrink: 0 }} />}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Network status */}
        <NetworkStatusPill />

        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "8px", marginBottom: "2px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "#1a4d30", border: "1.5px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#a7f3d0", flexShrink: 0, fontFamily: "'Sora', sans-serif" }}>{initials}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ color: "#e2f5ea", fontSize: "12.5px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.fullName}</p>
              <p style={{ color: "#3d6650", fontSize: "11px", fontWeight: 500 }}>Student</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "7px", color: "#4d7a62", fontSize: "13px", fontWeight: 500, cursor: "pointer", background: "transparent", border: "none", transition: "all 0.12s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = SIDEBAR_HOVER_BG; (e.currentTarget as HTMLButtonElement).style.color = "#7da890"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#4d7a62"; }}
          >
            <LogOut style={{ width: "14px", height: "14px" }} />
            Sign out
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <OfflineBanner role="student" />
        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
