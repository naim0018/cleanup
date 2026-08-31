import React, { useState } from "react";
import { Terminal, Copy, CheckCircle2, ShieldCheck, FileCode, Check } from "lucide-react";
import { toast } from "sonner";

export const CliGuideSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"global" | "dev" | "npx" | "pnpm">("global");
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const commands = {
    global: {
      title: "Global Installation",
      cmd: "npm install -g malware-cleanup",
      desc: "Installs the scanner system-wide, enabling 'malware-cleanup' from any project terminal.",
    },
    dev: {
      title: "Project Dev Dependency",
      cmd: "npm install -D malware-cleanup",
      desc: "Adds the scanner to package.json devDependencies and configures Git hooks for your project team.",
    },
    npx: {
      title: "Instant NPX Execution",
      cmd: "npx malware-cleanup",
      desc: "Run a zero-install local workspace scan directly from your terminal.",
    },
    pnpm: {
      title: "PNPM / Yarn Installation",
      cmd: "pnpm add -g malware-cleanup",
      desc: "Compatible with modern package managers for fast, deterministic installations.",
    },
  };

  const handleCopy = (cmd: string, tabKey: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedTab(tabKey);
    toast.success(`Copied command: ${cmd}`);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="surface shadow-all rounded-xl border border-border p-8 lg:p-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
        {/* Left Information Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 text-small font-medium border border-indigo-500/20">
            <Terminal className="w-4 h-4" />
            <span>NPM Package & CLI Guide</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-text leading-tight">
            Command-Line Scanner & Local Git Hooks
          </h2>

          <p className="text-body text-secondary-text leading-relaxed">
            Integrate malware auditing directly into your developer machine or CI/CD pipelines using our official NPM package. Automatically hooks into Git pre-push and post-pull triggers.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-layout-bg border border-border">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-small font-medium text-primary-text">Automatic Git Hook Injection</p>
                <p className="text-xs text-secondary-text">Blocks infected code before it leaves your local repository.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-layout-bg border border-border">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-small font-medium text-primary-text">AST Code Auditor</p>
                <p className="text-xs text-secondary-text">Fast, AST-level detection for JS, TS, Python, and JSON configs.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-layout-bg border border-border">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-small font-medium text-primary-text">CI/CD Pipeline Ready</p>
                <p className="text-xs text-secondary-text">Return code 0 on clean code, exit non-zero when threats are detected.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Tabbed Code Terminal */}
        <div className="lg:col-span-7 w-full space-y-4">
          {/* Tab Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border">
            {(Object.keys(commands) as Array<keyof typeof commands>).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === key
                    ? "bg-primary-brand text-white shadow-sm"
                    : "text-secondary-text hover:bg-layout-bg hover:text-primary-text"
                }`}
              >
                {commands[key].title}
              </button>
            ))}
          </div>

          {/* Active Command Box */}
          <div className="space-y-2">
            <p className="text-xs text-secondary-text">{commands[activeTab].desc}</p>
            <div className="bg-slate-950 rounded-xl p-4 flex items-center justify-between border border-slate-800 shadow-inner group">
              <div className="flex items-center gap-3 overflow-x-auto pr-2">
                <span className="text-emerald-500 font-mono text-sm select-none">$</span>
                <code className="text-emerald-400 font-mono text-sm whitespace-nowrap">
                  {commands[activeTab].cmd}
                </code>
              </div>

              <button
                onClick={() => handleCopy(commands[activeTab].cmd, activeTab)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800 shrink-0 cursor-pointer"
                title="Copy to clipboard"
              >
                {copiedTab === activeTab ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Simulated CLI Terminal Output Box */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-3 font-mono text-xs text-slate-300 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-slate-500 text-[11px] ml-2">malware-cleanup CLI v1.0.0</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>AST Active</span>
              </div>
            </div>

            <div className="space-y-1.5 leading-relaxed overflow-x-auto">
              <p className="text-slate-500">[14:15:02] Initializing AST signature engine...</p>
              <p className="text-slate-300">[14:15:03] Auditing local workspace files (42 files)...</p>
              <p className="text-amber-400">[14:15:04] WARN: Suspicious eval buffer found in src/utils/legacy.js:L42</p>
              <p className="text-emerald-400">[14:15:05] SUCCESS: Automatically sanitized legacy.js (0 malwares remaining)</p>
              <p className="text-emerald-400 font-semibold mt-2">[14:15:05] Audit Complete: 0 threat indicators remaining. Workspace clean!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
