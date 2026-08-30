import React, { useState, useEffect } from "react";
import { Github, ShieldCheck, Lock, RefreshCw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authMethod, setAuthMethod] = useState<"app" | "oauth">("app");
  const [isConnecting, setIsConnecting] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [apiToken, setApiToken] = useState("");

  // Check if we already have a session or just returned from the backend OAuth flow
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get("token");
    const existingToken = localStorage.getItem("github_pat");

    if (urlToken) {
      setIsRedirecting(true);
      localStorage.setItem("github_pat", urlToken);
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    } else if (existingToken) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCheckingAuth(false);
    }
  }, [location, navigate]);

  const handleConnect = async () => {
    if (authMethod === "oauth" && !apiToken.trim()) {
      alert("Please enter a valid GitHub Personal Access Token.");
      return;
    }

    setIsConnecting(true);

    try {
      if (authMethod === "oauth") {
        // Save the PAT to localStorage so the application can use it
        localStorage.setItem("github_pat", apiToken);
        // Navigate to the main application
        navigate("/");
      } else {
        // Redirect to our backend's OAuth endpoint which will handle the GitHub flow
        const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
        window.location.href = `${apiBase}/auth/github`;
      }
    } catch {
      alert("Failed to authenticate.");
      setIsConnecting(false);
    }
  };

  if (checkingAuth || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-layout-bg p-4">
        <div className="w-full max-w-xl surface shadow-all rounded-3xl p-8 space-y-6 animate-pulse">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="space-y-3">
            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3 mx-auto"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6 mx-auto"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-4/5 mx-auto"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
          <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full pt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-layout-bg p-4">
      <div className="w-full max-w-xl surface shadow-all rounded-3xl p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-primary-text text-center">Authenticate GitHub Access</h2>
        <p className="text-sm text-secondary-text text-center mt-2">
          Select your integration approach. GitHub App is recommended to authorize specific repository listings and permissions.
        </p>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button
            type="button"
            onClick={() => setAuthMethod("app")}
            className={`p-4 rounded-xl border text-left transition-all ${
              authMethod === "app"
                ? "border-primary-brand bg-primary-brand/5 text-primary-brand ring-2 ring-primary-brand/20"
                : "border-border hover:border-slate-300 text-secondary-text"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider">GitHub App</span>
              <ShieldCheck className="w-5 h-5 text-primary-brand" />
            </div>
            <p className="text-xs text-secondary-text mt-2">
              (Recommended) Granular scoping. Install on chosen repos only.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAuthMethod("oauth")}
            className={`p-4 rounded-xl border text-left transition-all ${
              authMethod === "oauth"
                ? "border-primary-brand bg-primary-brand/5 text-primary-brand ring-2 ring-primary-brand/20"
                : "border-border hover:border-slate-300 text-secondary-text"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider">OAuth Access</span>
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-xs text-secondary-text mt-2">
              Standard broad access token scope. Simple quick start.
            </p>
          </button>
        </div>

        {authMethod === "oauth" && (
          <div className="mt-6 space-y-2">
            <label className="text-xs font-bold text-secondary-text block">Personal Access Token (PAT)</label>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl bg-light-background text-sm focus:border-primary-brand focus:ring-1 focus:ring-primary-brand outline-none transition-all"
            />
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full mt-8 py-3.5 bg-brand-gradient hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer text-button"
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Github className="w-5 h-5" />
              Connect with {authMethod === "app" ? "GitHub App" : "OAuth PAT"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
