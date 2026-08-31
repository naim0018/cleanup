import React from "react";
import { Lock, GitMerge, Cpu } from "lucide-react";


export const FeaturesSection: React.FC = () => {
  return (
    <div className="">
              {/* 3 Creative Cards in Row/Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 w-full">
          {/* Card 1: Light Card */}
          <div className="surface rounded-xl border border-border shadow-sm p-6 flex flex-col items-start text-left gap-4 transition-all duration-200 hover:shadow-md hover:border-primary-brand/35">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-primary-brand shrink-0 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h3 className="text-card text-primary-text dark:text-white">Deep Scan</h3>
              <p className="text-body text-secondary-text text-sm leading-relaxed">
                Comprehensive AST-based analysis to detect obfuscated malware and vulnerabilities.
              </p>
            </div>
          </div>

          {/* Card 2: Dark Card with dot pattern */}
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl border border-slate-850 dark:border-slate-900 shadow-sm p-6 flex flex-col items-start text-left gap-4 transition-all duration-200 hover:shadow-md hover:shadow-primary-brand/5 relative overflow-hidden group">
            {/* Dot Pattern Background */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            <div className="p-3 rounded-lg bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 text-primary-brand shrink-0 shadow-inner relative z-10">
              <GitMerge className="w-5 h-5" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-card text-white!">Auto Clean & Commit</h3>
              <p className="text-body text-slate-400 text-sm leading-relaxed">
                Automatically fixes malicious code and creates secure commits directly to your branch.
              </p>
            </div>
          </div>

          {/* Card 3: Light Card with Glow blob & Badge */}
          <div className="surface rounded-xl border border-border shadow-sm p-6 flex flex-col items-start text-left gap-4 transition-all duration-200 hover:shadow-md hover:border-primary-brand/35 relative overflow-hidden">
            {/* Soft blue glow blob */}
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-primary-brand/5 rounded-full blur-2xl pointer-events-none" />

            <div className="p-3 rounded-lg bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-primary-brand shrink-0 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between gap-2 w-full">
                <h3 className="text-card text-primary-text dark:text-white">Pre-Push Hooks</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  ACTIVE
                </span>
              </div>
              <p className="text-body text-secondary-text text-sm leading-relaxed">
                Stop threats before they reach your codebase with automated pre-commit and pre-push hooks.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
};
