import React from "react";
import { ShieldCheck, Github } from "lucide-react";
import { Link } from "react-router-dom";
import PrimaryButton from "@/common/PrimaryButton";

export const CtaBanner: React.FC = () => {
  return (
    <div className="w-full rounded-xl bg-brand-gradient p-8 lg:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-5">
        <div className="p-3.5 rounded-xl bg-white/10 shrink-0">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl text-white leading-tight">
            Ready to secure your code?
          </h2>
          <p className="text-sm text-white/80 mt-1">
            Join thousands of developers who trust Script Cleanup.
          </p>
        </div>
      </div>

      <Link to="/github-scan" className="shrink-0 w-full sm:w-auto">
        <PrimaryButton
          variant="outline"
          leftIcon={<Github className="w-4 h-4" />}
          title="Login with GitHub"
          className="bg-white text-slate-900 border-white hover:bg-white/90 hover:text-slate-900 hover:border-white w-full sm:w-auto shadow-sm"
        />
      </Link>
    </div>
  );
};
