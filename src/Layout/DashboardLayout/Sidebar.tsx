import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  History, 
  Settings,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("github_pat");
    localStorage.removeItem("github_app_auth");
    window.location.href = "/login";
  };

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  ];

  return (
    <aside className="w-64 bg-layout-bg/80 backdrop-blur-xl border-r border-border h-screen flex flex-col fixed left-0 top-0 z-20 transition-all">
      <div className="h-20 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-primary-text text-lg tracking-tight">Cleanup</span>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${
                isActive 
                  ? "bg-primary-brand/10 text-primary-brand font-semibold" 
                  : "text-secondary-text hover:bg-light-background hover:text-primary-text font-medium"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-status-danger hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium text-sm transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Disconnect
        </button>
      </div>
    </aside>
  );
}
