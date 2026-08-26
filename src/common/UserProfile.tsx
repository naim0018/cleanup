/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Power, LayoutDashboard, User, Settings, Activity } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { toast } from "sonner";
import { logOut } from "@/store/features/AuthSlice/authSlice";
import { cn } from "@/lib/utils";

interface UserProfileProps {
  className?: string;
}

export default function UserProfile({ className }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);

  const demoUser = {
    name: "Alex",
    email: "alex@example.com",
    role: "Manager Admin",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
  };

  const displayName = user?.email ? user.email.split("@")[0] : demoUser.name;
  const displayEmail = user?.email || demoUser.email;
  const displayImage = demoUser.profileImage;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    try {
      dispatch(logOut());
      toast.success("Logout successful");
      setIsOpen(false);
      navigate("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className={cn("relative flex items-center", className)} ref={dropdownRef}>
      {/* Trigger Button — photo only, no chevron, no text */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500/20 border border-border transition-all focus:outline-none cursor-pointer flex items-center justify-center bg-white"
      >
        <img
          src={displayImage}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-primary-background rounded-lg border border-border overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          {/* Header card */}
          <div className="p-4 bg-light-background border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary-background border border-border shrink-0">
                <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-primary-text truncate">{displayName}</span>
                <span className="text-xs text-secondary-text truncate">{displayEmail}</span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="p-2 space-y-0.5">
            <DropdownLink to="/admin"             icon={LayoutDashboard} label="Dashboard"    onClick={() => setIsOpen(false)} iconColor="text-blue-500"    bgColor="bg-blue-500/10" />
            <DropdownLink to="/profile"           icon={User}            label="My Profile"   onClick={() => setIsOpen(false)} iconColor="text-violet-500"  bgColor="bg-violet-500/10" />
            <DropdownLink to="/settings"          icon={Settings}        label="Settings"     onClick={() => setIsOpen(false)} iconColor="text-amber-500"   bgColor="bg-amber-500/10" />
            <DropdownLink to="/user-activity-log" icon={Activity}        label="Activity Log" onClick={() => setIsOpen(false)} iconColor="text-emerald-500" bgColor="bg-emerald-500/10" />
          </div>

          {/* Footer / Logout */}
          <div className="p-2 border-t border-border bg-light-background">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-500/10 rounded-lg transition-all duration-200 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100/50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <Power className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold">Logout Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownLinkProps {
  to: string;
  icon: any;
  label: string;
  onClick: () => void;
  iconColor?: string;
  bgColor?: string;
}

function DropdownLink({ to, icon: Icon, label, onClick, iconColor, bgColor }: DropdownLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 text-primary-text hover:bg-light-background rounded-lg transition-all duration-200 group no-underline"
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200", bgColor)}>
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
      <span className="text-sm font-semibold">{label}</span>
      <ChevronDown className="w-3 h-3 ml-auto opacity-0 -rotate-90 group-hover:opacity-40 transition-all duration-200" />
    </Link>
  );
}