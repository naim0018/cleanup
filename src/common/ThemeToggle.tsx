import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme.tsx";
import { cn } from "@/lib/utils";
import { useRef } from "react";

export const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    // Pin the clip-path origin to the center of the toggle button
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
      const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
      document.documentElement.style.setProperty("--vt-x", `${x.toFixed(1)}%`);
      document.documentElement.style.setProperty("--vt-y", `${y.toFixed(1)}%`);
    }

    // Use View Transitions API when supported, otherwise fall back
    if (!document.startViewTransition) {
      toggleTheme();
      return;
    }

    document.startViewTransition(() => {
      toggleTheme();
    });
  };

  return (
    <button
      ref={btnRef}
      onClick={handleToggle}
      className={cn(
        "relative p-2 rounded-full transition-all duration-300 group",
        "hover:bg-primary-brand/10 dark:hover:bg-white/10",
        "border border-transparent hover:border-primary-brand/20 dark:hover:border-white/20",
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="relative size-6 overflow-hidden">
        <Sun
          className={cn(
            "size-6 transition-all duration-500 absolute",
            theme === "dark" ? "-top-full rotate-90 opacity-0" : "top-0 rotate-0 opacity-100",
            "text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "size-6 transition-all duration-500 absolute",
            theme === "light" ? "top-full -rotate-90 opacity-0" : "top-0 rotate-0 opacity-100",
            "text-indigo-400"
          )}
        />
      </div>
      
      {/* Subtle glow effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300",
        theme === "light" ? "bg-amber-400" : "bg-indigo-400"
      )} />
    </button>
  );
};
