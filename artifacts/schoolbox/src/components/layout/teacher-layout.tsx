import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LayoutDashboard, ClipboardCheck, AlertTriangle, Users, BookOpen, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfflineBanner } from "@/components/offline-banner";

export function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { name: "Attendance", href: "/teacher/attendance", icon: ClipboardCheck },
    { name: "Risk Alerts", href: "/teacher/risk", icon: AlertTriangle },
    { name: "My Classes", href: "/teacher/classes", icon: Users },
    { name: "Content", href: "/teacher/content", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="md:hidden bg-primary text-primary-foreground p-4 flex justify-between items-center">
        <div className="font-bold text-xl">SchoolBox Teacher</div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-primary-foreground">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className={`${isMobileMenuOpen ? "block" : "hidden"} md:block w-full md:w-64 bg-primary text-primary-foreground flex-shrink-0`}>
        <div className="p-6 hidden md:block">
          <div className="font-bold text-2xl tracking-tight">SchoolBox</div>
          <div className="text-sm opacity-80 mt-1">Teacher Portal</div>
        </div>
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.name} href={item.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer transition-colors ${isActive ? "bg-white/20 font-medium" : "hover:bg-white/10"}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto">
          <div className="px-4 py-3 mb-2">
            <div className="text-sm font-medium truncate">{user?.fullName}</div>
            <div className="text-xs opacity-80">Teacher</div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-primary-foreground hover:bg-white/10 hover:text-white" onClick={() => logout()}>
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex flex-col">
        <OfflineBanner role="teacher" />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
