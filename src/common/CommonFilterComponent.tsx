import React from "react";
import { LucideIcon } from "lucide-react";
import { FilterDatePicker } from "./FilterDatePicker";
import { FilterSelect } from "./FilterSelect";
import { cn } from "@/lib/utils";

export interface FilterSelectConfig {
  key: string;
  title: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
  icon?: LucideIcon;
}

export interface CommonFilterComponentProps {
  /** Optional date range control props */
  startDate?: Date;
  endDate?: Date;
  onDateChange?: (range: { from: Date; to?: Date } | undefined) => void;
  onPrevDate?: () => void;
  onNextDate?: () => void;
  showDatePicker?: boolean;

  /** Dropdown select configurations */
  selects?: FilterSelectConfig[];

  /** Optional custom class for outer wrapper */
  className?: string;
}

export function CommonFilterComponent({
  startDate,
  endDate,
  onDateChange,
  onPrevDate,
  onNextDate,
  showDatePicker = true,
  selects = [],
  className,
}: CommonFilterComponentProps) {
  const hasSelects = selects.length > 0;

  return (
    <div className={cn("flex flex-col lg:flex-row gap-3 w-full", className)}>
      {/* Date Picker (Optional) */}
      {showDatePicker && startDate && endDate && (
        <FilterDatePicker
          startDate={startDate}
          endDate={endDate}
          onPrev={onPrevDate}
          onNext={onNextDate}
          onDateChange={onDateChange}
          className="w-full lg:w-90 xl:w-120 shrink-0"
        />
      )}

      {/* Selects: dynamically scales the grid cols based on config length */}
      {hasSelects && (
        <div
          className={cn(
            "grid gap-2 sm:gap-3 flex-1 min-w-0",
            selects.length === 1 && "grid-cols-1",
            selects.length === 2 && "grid-cols-2",
            selects.length === 3 && "grid-cols-3",
            selects.length === 4 && "grid-cols-4"
          )}
        >
          {selects.map((select) => (
            <FilterSelect
              key={select.key}
              icon={select.icon}
              title={select.title}
              options={select.options}
              value={select.value}
              onChange={select.onChange}
              className="w-full h-11 md:h-12! text-xs md:text-sm lg:text-base"
            />
          ))}
        </div>
      )}
    </div>
  );
}
