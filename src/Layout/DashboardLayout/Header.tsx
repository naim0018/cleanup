import React, { useEffect, useState } from "react";
import { Github, Search, LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ login: string; avatar_url: string } | null>(null);

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

  return (
    <header className="h-20 bg-layout-bg/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 md:px-8 sticky top-0 z-20 shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-secondary-text hover:text-primary-text md:hidden rounded-md focus:outline-none transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">Overview</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative group hidden md:block">
          <Search className="w-4 h-4 text-secondary-text absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-primary-brand transition-colors" />
          <input 
            type="text" 
            placeholder="Search repositories..." 
            className="pl-10 pr-4 py-2.5 bg-light-background border border-border rounded-full text-sm focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/20 outline-none transition-all w-72 placeholder:text-secondary-text text-primary-text"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-primary-text">{profile?.login || "Connected"}</span>
              <span className="text-[11px] text-secondary-text uppercase tracking-wider font-semibold">GitHub Account</span>
            </div>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-md object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-light-background border-2 border-border flex items-center justify-center shadow-inner">
                <Github className="w-5 h-5 text-primary-text" />
              </div>
            )}
          </div>
          
          <div className="w-px h-8 bg-border"></div>
          
          <button 
            onClick={handleDisconnect}
            className="p-2.5 text-secondary-text hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all group"
            title="Disconnect"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
