
import { useState } from "react";
import { LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FaCaretDown } from "react-icons/fa";

interface FilterSelectProps {
  icon?: LucideIcon;
  title: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  variant?: "primary" | "outline";
}

export function FilterSelect({
  icon: Icon,
  title,
  options,
  value: controlledValue,
  onChange,
  className,
  variant = "primary",
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState<string | undefined>(undefined);

  const value = controlledValue !== undefined ? controlledValue : localValue;
  const displayValue = value || title;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 h-12 w-full rounded-lg text-body transition-all active:scale-[0.98] outline-none",
              variant === "primary"
                ? "bg-brand-gradient text-white! shadow-sm hover:opacity-90 font-normal!"
                : "bg-slate-50 dark:bg-slate-800 text-body surface hover:bg-slate-100 dark:hover:bg-slate-700",
              open && "pointer-events-none",
              className
            )}
          >
            {Icon && <Icon className="size-4 sm:size-5 shrink-0" />}
            <span className="truncate">{displayValue}</span>
            <FaCaretDown className="size-4 sm:size-5 shrink-0 ml-1" />
          </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--anchor-width)] p-1.5 bg-white dark:bg-slate-900 rounded-lg"
        style={{ boxShadow: "0px 2px 20px rgba(100, 116, 139, 0.12)" }}
        align="start"
        sideOffset={8}
      >
        <div className="flex flex-col gap-0.5">
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <button
                key={opt}
                onClick={() => {
                  if (controlledValue === undefined) {
                    setLocalValue(opt);
                  }
                  onChange?.(opt);
                  setOpen(false);
                }}
                className={cn(
                  "text-left px-3 py-2.5 text-body rounded-lg transition-colors outline-none",
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/60 text-primary-brand font-medium"
                    : "text-secondary-text hover:text-primary-brand hover:bg-light-background focus-visible:bg-light-background"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
