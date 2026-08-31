import React, { useEffect, useState } from "react";
import { Github, LogOut, Menu, ShieldCheck, LayoutDashboard, X } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<{ login: string; avatar_url: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("github_pat");
      if (!token) return;

      try {
        const res = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile({ login: data.login, avatar_url: data.avatar_url });
        }
      } catch (err) {
        console.error("Failed to fetch GitHub profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleDisconnect = () => {
    localStorage.removeItem("github_pat");
    localStorage.removeItem("github_app_auth");
    navigate("/login");
  };

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Scanned Repos", icon: ShieldCheck, path: "/scanned" },
  ];

  return (
    <header className="bg-layout-bg/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-sm transition-all flex flex-col items-center w-full relative">
      <div className="w-full max-w-[1600px] h-16 flex items-center justify-between px-6 md:px-8 relative">
        {/* Left Side: Logo */}
        <div className="flex items-center h-full">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-primary-text text-lg tracking-tight whitespace-nowrap">Cleanup</span>
          </div>
        </div>
        
        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 h-full absolute left-1/2 -translate-x-1/2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 h-full border-b-2 transition-all px-1 ${
                  isActive 
                    ? "border-primary-brand text-primary-brand font-semibold" 
                    : "border-transparent text-secondary-text hover:text-primary-text hover:border-gray-300 font-medium"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Right Side: Profile & Actions */}
        <div className="flex items-center gap-4 md:gap-6 h-full">
          <div className="hidden md:flex items-center gap-4 h-full">
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-sm font-bold text-primary-text leading-tight">{profile?.login || "Connected"}</span>
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-semibold">GitHub Account</span>
              </div>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-light-background border-2 border-border flex items-center justify-center shadow-inner">
                  <Github className="w-4 h-4 text-primary-text" />
                </div>
              )}
            </div>
            
            <div className="w-px h-6 bg-border"></div>
            
            <button 
              onClick={handleDisconnect}
              className="p-2 text-secondary-text hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all group flex items-center"
              title="Disconnect"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-secondary-text hover:text-primary-text md:hidden rounded-md focus:outline-none transition-colors cursor-pointer flex items-center"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-layout-bg/95 backdrop-blur-xl px-4 py-4 space-y-4 w-full absolute top-16 left-0 shadow-lg shadow-black/5">
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
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
          </nav>
          
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-md object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-light-background border-2 border-border flex items-center justify-center shadow-inner">
                  <Github className="w-5 h-5 text-primary-text" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-primary-text">{profile?.login || "Connected"}</span>
                <span className="text-[11px] text-secondary-text uppercase tracking-wider font-semibold">GitHub Account</span>
              </div>
            </div>
            
            <button 
              onClick={handleDisconnect}
              className="p-2 text-secondary-text hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all"
              title="Disconnect"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
