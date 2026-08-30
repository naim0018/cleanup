import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-500/10 via-layout-bg to-purple-500/10 text-primary-text font-sans selection:bg-primary-brand selection:text-white relative">
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />
      <main className={`flex-1 flex flex-col h-screen overflow-hidden relative z-10 transition-all duration-300 ${
        isCollapsed ? "md:ml-20" : "md:ml-64"
      } ml-0`}>
        <Header onMenuClick={() => setIsMobileOpen(true)} />
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
