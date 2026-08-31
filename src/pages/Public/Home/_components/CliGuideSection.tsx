import React, { useState } from "react";
import { Copy, Check, CheckCircle2, Code2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import PrimaryButton from "@/common/PrimaryButton";

export const NpmPackageSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const cmd = "npm install -g malware-cleanup";

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-xl  p-8 lg:p-10 border">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
        {/* Left side (Header & Command box) - Spans 6 cols */}
        <div className="lg:col-span-6 space-y-5">
          <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary-brand/10 text-primary-brand text-xs font-medium uppercase tracking-wider">
            NPM Package
          </span>

          <h2 className="text-2xl sm:text-3xl text-primary-text dark:text-white leading-tight">
            Protect your workflow locally
          </h2>

          <p className="text-body text-secondary-text leading-relaxed">
            Install our lightweight npm package to enable real-time protection in your local development environment.
          </p>

          {/* Command box */}
          <div className="bg-brand-gradient rounded-lg p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-x-auto min-w-0">
              <span className="text-blue-100 font-mono text-sm select-none shrink-0">$</span>
              <code className="text-white font-mono text-sm whitespace-nowrap">{cmd}</code>
            </div>
            <PrimaryButton
              onClick={handleCopy}
              size="icon"
              variant="primary"
              className="bg-white/10 hover:bg-white/20 border-none shrink-0 text-white ml-3"
              leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Right side (Checklist & Illustration) - Spans 6 cols */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Checklist - Spans 7 cols */}
          <div className="sm:col-span-7 space-y-4">
            {[
              "Pre Push Hook — Blocks malicious code",
              "Pre Pull Hook — Scans before pulling",
              "Lightweight — Fast and developer-friendly",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary-brand shrink-0" />
                <span className="text-body text-primary-text dark:text-slate-200">{text}</span>
              </div>
            ))}
          </div>

          {/* Illustration - Spans 5 cols */}
          <div className="sm:col-span-5 flex justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Soft blue glow */}
              <div className="absolute inset-0 bg-primary-brand/10 dark:bg-primary-brand/20 blur-2xl rounded-full" />

              {/* Main Cube/Code block */}
              <div className="relative w-20 h-20 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition-transform hover:scale-105 duration-300">
                <Code2 className="w-8 h-8 text-slate-500 dark:text-slate-400" />
              </div>

              {/* Floating Shield */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-brand-gradient rounded-lg shadow-lg flex items-center justify-center text-white border border-primary-brand/20 animate-bounce" style={{ animationDuration: '3s' }}>
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
