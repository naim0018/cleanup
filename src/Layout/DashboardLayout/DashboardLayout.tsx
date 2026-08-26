import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-500/10 via-layout-bg to-purple-500/10 text-primary-text font-sans selection:bg-primary-brand selection:text-white relative">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col h-screen overflow-hidden relative z-10">
        <Header />
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
