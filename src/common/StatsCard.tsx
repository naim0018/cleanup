import React from "react";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  title: string;
  value: string | number;
  trendText?: string;
  trendType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  valueClassName?: string;
}

export const StatsCard = ({
  title,
  value,
  trendText,
  trendType = "positive",
  icon,
  align = "left",
  className,
  valueClassName,
}: StatsCardProps) => {
  return (
    <div
      className={cn(
        "p-5 rounded-xl bg-layout-bg flex flex-col gap-2 min-h-[110px]",
        align === "center"
          ? "items-center text-center justify-center"
          : "items-start text-left",
        className
      )}
    >
      <div
        className={cn(
          "flex w-full items-center",
          align === "center" ? "justify-center" : "justify-between"
        )}
      >
        <h3 className="text-primary-brand text-small font-medium tracking-wide">
          {title}
        </h3>
        {icon && align === "left" && (
          <div className="text-primary-brand/80 shrink-0">
            {icon}
          </div>
        )}
      </div>

      <p className={cn("text-xl font-semibold text-primary-text mt-1", valueClassName)}>
        {value}
      </p>

      {trendText && (
        <p
          className={cn(
            "text-xs font-medium mt-1",
            trendType === "positive" && "text-status-success",
            trendType === "negative" && "text-status-danger",
            trendType === "neutral" && "text-muted-blue"
          )}
        >
          {trendText}
        </p>
      )}
    </div>
  );
};
