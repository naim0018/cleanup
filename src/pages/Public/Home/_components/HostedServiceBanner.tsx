import React from "react";
import { ExternalLink, Globe, Sparkles, CheckCircle2 } from "lucide-react";
import PrimaryButton from "@/common/PrimaryButton";

export const HostedServiceBanner: React.FC = () => {
  return (
    <div className="surface shadow-all rounded-xl border border-border p-8 lg:p-10 w-full relative overflow-hidden">
      {/* Accent Background Gradient Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 w-full">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-small font-medium border border-emerald-500/20">
            <Globe className="w-4 h-4" />
            <span>Hosted Script Endpoint</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-text leading-tight">
            Automated Repository Cleanup Script API
          </h2>

          <p className="text-body text-secondary-text leading-relaxed">
            Need an online, cloud-hosted sanitization endpoint for your CI/CD pipelines, GitHub Actions, or webhooks? Access our hosted cleanup API directly at <span className="font-mono text-primary-brand">cleanupscript.vercel.app</span>.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-small text-secondary-text">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Webhook Compatible
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              REST API Endpoints
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              GitHub Actions Support
            </span>
          </div>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <a
            href="https://cleanupscript.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto block"
          >
            <PrimaryButton
              title="Open Hosted Cleanup Service"
              rightIcon={<ExternalLink className="w-4 h-4" />}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            />
          </a>
        </div>
      </div>
    </div>
  );
};
