import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-500/10 via-layout-bg to-purple-500/10 text-primary-text font-sans selection:bg-primary-brand selection:text-white relative">
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 flex flex-col items-center scroll-smooth">
        <div className="w-full max-w-[1600px] flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
