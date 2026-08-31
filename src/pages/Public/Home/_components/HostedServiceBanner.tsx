import React from "react";
import { Github, ShieldCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: <Github className="w-7 h-7" />,
    title: "Connect GitHub",
    description: "Authorize Script Cleanup and select the repositories you want to protect.",
  },
  {
    num: "02",
    icon: <ShieldCheck className="w-7 h-7" />,
    title: "Scan & Clean",
    description: "We scan your code, detect threats, clean infected files, and commit the fixes.",
  },
  {
    num: "03",
    icon: <ShieldCheck className="w-7 h-7" />,
    title: "Stay Protected",
    description: "Git hooks and continuous scans keep your codebase clean and secure.",
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <div className="w-full space-y-10 py-6">
      {/* Centered heading */}
      <div className="text-center space-y-4">
        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-primary-brand/10 text-primary-brand text-xs font-medium uppercase tracking-wider">
          How It Works
        </span>
        <h2 className="text-2xl sm:text-3xl text-primary-text dark:text-white leading-tight">
          Three simple steps
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-start">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-4 relative">
            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-8 -right-4 translate-x-1/2 z-10">
                <ArrowRight className="w-5 h-5 text-secondary-text" />
              </div>
            )}

            <div className="w-16 h-16 rounded-xl bg-primary-brand/5 dark:bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center text-primary-brand">
              {step.icon}
            </div>

            <span className="text-xs font-medium text-primary-brand tracking-wide">{step.num}</span>
            <h3 className="text-card text-primary-text dark:text-white">{step.title}</h3>
            <p className="text-body text-secondary-text leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
