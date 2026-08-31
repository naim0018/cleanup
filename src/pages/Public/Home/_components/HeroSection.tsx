import React from "react";
import { ShieldCheck, Play, Github } from "lucide-react";
import { Link } from "react-router-dom";
import PrimaryButton from "@/common/PrimaryButton";

export const HeroSection: React.FC = () => {
  return (
    <div className="w-full dark:bg-slate-900/50 pt-10 flex flex-col items-center text-center">
      <div className="w-full flex flex-col items-center text-center space-y-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-brand/10 text-primary-brand text-small font-medium border border-primary-brand/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Automated Code Security</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-bold text-primary-text dark:text-white leading-[1.15] tracking-tight">
          Detect. Clean. Protect your code.<br />
          <span className="text-primary-brand">Automatically.</span>
        </h1>

        {/* Subtitle / Description */}
        <p className="text-body text-secondary-text leading-relaxed max-w-xl">
          Script Cleanup scans your GitHub repositories, detects hidden malware and malicious code, cleans infected files, and commits the fixes automatically.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/github-scan">
            <PrimaryButton
              variant="primary"
              leftIcon={<Github className="w-4 h-4" />}
              title="Login with GitHub"
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 border-none"
            />
          </Link>
          <Link to="/scanned">
            <PrimaryButton
              variant="outline"
              leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
              title="See How It Works"
              className="border-slate-200 hover:border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            />
          </Link>
        </div>

      </div>
    </div>
  );
};
