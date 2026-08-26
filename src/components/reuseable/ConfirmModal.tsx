import { useEffect } from "react";
import { AlertTriangle, CheckCircle, Info, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  variant?: "danger" | "warning" | "info" | "success";
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = "info",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}: ConfirmModalProps) {
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: ShieldAlert,
          iconColor: "text-red-500",
          iconBg: "bg-red-500/10",
          btnClass: "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg hover:shadow-red-500/10 border-transparent",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconColor: "text-amber-500",
          iconBg: "bg-amber-500/10",
          btnClass: "bg-amber-500 hover:bg-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/10 border-transparent",
        };
      case "success":
        return {
          icon: CheckCircle,
          iconColor: "text-emerald-500",
          iconBg: "bg-emerald-500/10",
          btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg hover:shadow-emerald-500/10 border-transparent",
        };
      case "info":
      default:
        return {
          icon: Info,
          iconColor: "text-blue-500",
          iconBg: "bg-blue-500/10",
          btnClass: "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/10 border-transparent",
        };
    }
  };

  const config = getVariantStyles();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-6 shadow-2xl transition-all duration-300 transform scale-100 flex flex-col gap-4 text-left">
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex gap-4 items-start pr-8">
          <div className={cn("p-3 rounded-xl flex-shrink-0", config.iconBg, config.iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {description}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl h-11 border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold text-xs"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn("flex-1 rounded-xl h-11 font-bold text-xs", config.btnClass)}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
