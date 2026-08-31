import { useRouteError } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";

export default function ErrorPage() {
  const error = useRouteError() as any;
  console.error(error);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-layout-bg p-6">
      <div className="max-w-md w-full surface shadow-all rounded-xl border border-border p-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-primary-text mb-2">Oops! Something went wrong</h1>
        <p className="text-secondary-text mb-6">
          We're sorry, but an unexpected error occurred. 
        </p>
        
        <div className="bg-slate-900 rounded-lg p-4 w-full text-left overflow-x-auto mb-8 border border-slate-800">
          <code className="text-rose-400 text-xs font-mono">
            {error?.statusText || error?.message || "Unknown error"}
          </code>
        </div>

        <button
          onClick={() => window.location.href = "/"}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-all active:scale-95"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </button>
      </div>
    </div>
  );
}
