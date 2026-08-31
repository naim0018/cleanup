import React from "react";
import { ShieldCheck, ArrowRight, ShieldAlert, CheckCircle2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import PrimaryButton from "@/common/PrimaryButton";

export const HeroSection: React.FC = () => {
  return (
    <div className="surface shadow-all rounded-xl border border-border p-8 lg:p-10 w-full relative overflow-hidden">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center w-full relative z-10">
        {/* Left Headline Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-brand/10 text-primary-brand text-small font-medium border border-primary-brand/20">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Automated Code Security & Sanitation Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-text leading-tight tracking-tight">
            Shield Your Repositories from <span className="text-primary-brand">Stealth Malware</span> & Supply-Chain Attacks
          </h1>

          <p className="text-body text-secondary-text leading-relaxed">
            Perform deep AST-based syntax tree audits across your public and private GitHub repositories. Intercept malicious payloads, inspect malware signatures, and automatically generate clean pull requests with single-click resolution.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/github-scan">
              <PrimaryButton
                title="Launch GitHub Scanner"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                variant="primary"
                size="md"
              />
            </Link>

            <Link to="/scanned">
              <PrimaryButton
                title="View Scanned Log"
                leftIcon={<ShieldAlert className="w-4 h-4" />}
                variant="outline"
                size="md"
              />
            </Link>
          </div>

          {/* Quick Metrics Badges */}
          <div className="pt-4 border-t border-border/60 grid grid-cols-3 gap-4 text-left">
            <div>
              <p className="text-card font-semibold text-primary-text">100%</p>
              <p className="text-small text-secondary-text">AST Signature Accuracy</p>
            </div>
            <div>
              <p className="text-card font-semibold text-primary-text">Zero-Config</p>
              <p className="text-small text-secondary-text">Git Hooks Integration</p>
            </div>
            <div>
              <p className="text-card font-semibold text-primary-text">Automated</p>
              <p className="text-small text-secondary-text">Sanitized PR Patches</p>
            </div>
          </div>
        </div>

        {/* Right Interactive Preview Widget */}
        <div className="lg:col-span-5 w-full">
          <div className="surface shadow-all rounded-xl border border-border p-6 space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-card font-medium text-primary-text">Live Security Engine</span>
              </div>
              <span className="text-small text-primary-brand bg-primary-brand/10 px-2.5 py-0.5 rounded-full font-medium">
                Active & Monitoring
              </span>
            </div>

            {/* Simulated Live Scan Cards */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg bg-layout-bg border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-small font-medium text-primary-text">AST Scanner</p>
                    <p className="text-xs text-secondary-text">Obfuscated payload detection active</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Ready</span>
              </div>

              <div className="p-3.5 rounded-lg bg-layout-bg border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary-brand/10 text-primary-brand shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-small font-medium text-primary-text">Git Pre-Push Hook</p>
                    <p className="text-xs text-secondary-text">Intercept uncommitted malware locally</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-primary-brand bg-primary-brand/10 px-2 py-0.5 rounded">Enabled</span>
              </div>

              <div className="p-3.5 rounded-lg bg-layout-bg border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-small font-medium text-primary-text">Auto PR Sanitizer</p>
                    <p className="text-xs text-secondary-text">Single-click patch generation</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Automated</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary-brand/5 border border-primary-brand/20 text-center">
              <p className="text-xs text-secondary-text">
                Scans public & private repos seamlessly via GitHub PAT authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
