import React from "react";
import { Cpu, GitPullRequest, ShieldCheck, Building2, Code2, Sparkles } from "lucide-react";

export const FeaturesGrid: React.FC = () => {
  const features = [
    {
      icon: <Cpu className="w-5 h-5 text-blue-500" />,
      title: "AST Signature Auditing",
      description:
        "Traverses JavaScript, TypeScript, and Python Abstract Syntax Trees to uncover obfuscated eval strings, socket backdoors, and stealthy miners.",
      badge: "Deep Inspection",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />,
      title: "Git Pre-Push Enforcement",
      description:
        "Automatically installs Git hooks via the CLI scanner package, blocking infected pushes locally before malicious code hits your remote repository.",
      badge: "Local Protection",
    },
    {
      icon: <GitPullRequest className="w-5 h-5 text-emerald-500" />,
      title: "Automated Sanitation PRs",
      description:
        "Generates clean code patches and opens sanitized pull requests directly on GitHub with single-click batch resolution.",
      badge: "One-Click Remediation",
    },
    {
      icon: <Building2 className="w-5 h-5 text-purple-500" />,
      title: "Multi-Org Repository Support",
      description:
        "Gain instant visibility across personal accounts and organizational GitHub groups with real-time rate limit tracking.",
      badge: "Enterprise Ready",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-primary-brand text-small font-medium mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Platform Capabilities</span>
          </div>
          <h2 className="text-title font-semibold text-primary-text">
            Comprehensive Security Workflows
          </h2>
        </div>
        <p className="text-body text-secondary-text max-w-lg">
          Designed for individual developers and software engineering teams who demand clean, malware-free codebases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {features.map((feature, index) => (
          <div
            key={index}
            className="surface shadow-all rounded-xl border border-border p-6 flex flex-col justify-between gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-lg bg-layout-bg border border-border group-hover:border-primary-brand/30 transition-colors">
                  {feature.icon}
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-layout-bg border border-border text-secondary-text">
                  {feature.badge}
                </span>
              </div>

              <h3 className="text-card font-semibold text-primary-text group-hover:text-primary-brand transition-colors">
                {feature.title}
              </h3>

              <p className="text-body text-secondary-text text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>

            <div className="pt-3 border-t border-border/40 flex items-center gap-1.5 text-xs text-primary-brand font-medium">
              <Code2 className="w-3.5 h-3.5" />
              <span>Automated Workflow</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
