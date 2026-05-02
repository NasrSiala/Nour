import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LayoutDashboard, Users, GraduationCap, BarChart2, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineBanner } from "@/components/offline-banner";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Classes", href: "/admin/classes", icon: GraduationCap },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
  ];

  const initials = user?.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "A";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 text-white"
        style={{ background: "linear-gradient(135deg, #0a3d25 0%, #1a7a52 100%)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold">{initials}</div>
          <span className="font-bold text-sm">SchoolBox Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white hover:bg-white/10">
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? "block" : "hidden"} md:flex md:flex-col w-full md:w-60 flex-shrink-0`}
        style={{ background: "linear-gradient(180deg, #0a3d25 0%, #0f5535 60%, #1a7a52 100%)" }}>
        {/* Brand */}
        <div className="hidden md:flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-tight">SchoolBox</p>
            <p className="text-green-300 text-xs">Admin Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 pt-4">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href}>
                <div onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm font-medium ${
                    isActive
                      ? "bg-white text-green-900 shadow-sm"
                      : "text-green-100/80 hover:bg-white/10 hover:text-white"
                  }`}>
                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-400/30 border border-green-300/30 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.fullName}</p>
              <p className="text-green-300 text-xs">Administrator</p>
            </div>
          </div>
          <button onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-green-100/70 hover:bg-white/10 hover:text-white transition-colors text-sm">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <OfflineBanner role="admin" />
        <main className="flex-1 p-5 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
