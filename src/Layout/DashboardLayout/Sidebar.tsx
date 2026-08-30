import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}: SidebarProps) {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("github_pat");
    localStorage.removeItem("github_app_auth");
    window.location.href = "/login";
  };

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Scanned Repos", icon: ShieldCheck, path: "/scanned" },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside className={`bg-layout-bg/85 backdrop-blur-xl border-r border-border h-screen flex flex-col fixed left-0 top-0 z-40 transition-all duration-300 ${
        isCollapsed ? "md:w-20" : "md:w-64"
      } ${
        isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
      }`}>
        {/* Sidebar Header */}
        <div className={`h-20 flex items-center border-b border-border px-6 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-primary-text text-lg tracking-tight whitespace-nowrap">Cleanup</span>
            )}
          </div>
        </div>

        {/* Sidebar Links */}
        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center rounded-md transition-all ${
                  isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3"
                } ${
                  isActive 
                    ? "bg-primary-brand/10 text-primary-brand font-semibold" 
                    : "text-secondary-text hover:bg-light-background hover:text-primary-text font-medium"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Desktop Collapse & Log Out Actions footer */}
        <div className="p-4 border-t border-border space-y-2">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center rounded-md text-status-danger hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium text-sm transition-colors cursor-pointer ${
              isCollapsed ? "justify-center p-3" : "justify-center gap-2 py-2.5 px-4"
            }`}
            title={isCollapsed ? "Disconnect" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Disconnect</span>}
          </button>

          {/* Desktop Collapse Trigger Arrow */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full hidden md:flex items-center justify-center p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/50 text-secondary-text transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
