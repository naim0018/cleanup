import React, { useState } from "react";
import { Calendar as CalendarIcon, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FaPlay } from "react-icons/fa";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReactCalendar from "react-calendar";
import PrimaryButton from "@/common/PrimaryButton";

interface FilterDatePickerProps {
  startDate: Date;
  endDate: Date;
  onPrev?: () => void;
  onNext?: () => void;
  onDateChange?: (range: { from: Date; to?: Date } | undefined) => void;
  className?: string;
}

export function FilterDatePicker({
  startDate,
  endDate,
  onPrev,
  onNext,
  onDateChange,
  className,
}: FilterDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<[Date, Date] | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setTempRange(null);
      setCalendarKey((prev) => prev + 1);
    }
  };

  // Simple formatter for "Jun 3, 2026"
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        onClick={onPrev}
        className="flex items-center justify-center size-10 sm:size-11.5 rounded-lg bg-brand-gradient shadow-sm text-white transition-opacity hover:opacity-90 active:scale-[0.98] outline-none shrink-0"
      >
        <FaPlay className="size-2.5 sm:size-3" transform="rotate(180)" />
      </button>

      <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center justify-center gap-1.5 sm:gap-2.5 px-2 sm:px-4 w-full h-10 sm:h-12 rounded-lg bg-brand-gradient shadow-sm text-white! font-normal transition-opacity hover:opacity-90 active:scale-[0.98] outline-none min-w-0",
              open && "pointer-events-none"
            )}
          >
            <CalendarIcon className="size-4 sm:size-5 shrink-0" strokeWidth={1.5} />
            <span className="truncate text-body">
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--anchor-width)] min-w-[240px] p-3 bg-white dark:bg-slate-900 rounded-lg"
          style={{ boxShadow: "0px 2px 20px rgba(100, 116, 139, 0.12)" }}
          align="center"
        >
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-primary-text">
              Select date range
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="custom-calendar-wrapper">
            <ReactCalendar
              key={calendarKey}
              selectRange={true}
              defaultValue={undefined}
              onChange={(val) => {
                if (Array.isArray(val) && val[0] instanceof Date && val[1] instanceof Date) {
                  setTempRange([val[0], val[1]]);
                }
              }}
              className="border-none font-inter w-full"
              nextLabel={<span className="text-secondary-text">&gt;</span>}
              prevLabel={<span className="text-secondary-text">&lt;</span>}
              next2Label={null}
              prev2Label={null}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-1.5">
            <Info className="text-primary-brand mt-0.5 shrink-0 size-3" />
            <p className="text-[10px] text-secondary-text leading-tight">
              {tempRange && tempRange[0] && tempRange[1] ? (
                <span>
                  Selected:{" "}
                  <span className="font-semibold text-primary-text">
                    {tempRange[0].toLocaleDateString()}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-primary-text">
                    {tempRange[1].toLocaleDateString()}
                  </span>
                </span>
              ) : (
                "Click a start date and then an end date to select a range."
              )}
            </p>
          </div>

          <div className="mt-3 flex gap-2">
            <PrimaryButton
              variant="outline"
              className="flex-1 h-10 rounded-lg text-sm font-semibold border border-gray-200 text-primary-text"
              onClick={() => {
                setTempRange(null);
                setCalendarKey((prev) => prev + 1);
              }}
            >
              Reset
            </PrimaryButton>
            <PrimaryButton
              variant="primary"
              className="flex-1 h-10 text-sm font-semibold bg-brand-gradient hover:opacity-90 text-white shadow-sm rounded-lg"
              onClick={() => {
                if (tempRange && onDateChange) {
                  onDateChange({ from: tempRange[0], to: tempRange[1] });
                }
                setOpen(false);
              }}
            >
              Apply
            </PrimaryButton>
          </div>

          <style>{`
            /* Root react-calendar component wrapper */
            .custom-calendar-wrapper .react-calendar {
              background: white;
              border: none;
              font-family: inter;
              width: 100%;
            }
            
            /* Top navigation container containing month title and prev/next page buttons */
            .custom-calendar-wrapper .react-calendar__navigation {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            
            /* Individual buttons for navigation (prev/next month icons) */
            .custom-calendar-wrapper .react-calendar__navigation button {
              min-width: 28px;
              height: 28px;
              background: white;
              font-weight: 600;
              color: var(--primary-text);
              border-radius: var(--radius-sm);
              font-size: 13px;
              cursor: pointer;
              border: none;
            }
            
            /* Hover and focus states for navigation arrow buttons */
            .custom-calendar-wrapper .react-calendar__navigation button:enabled:hover,
            .custom-calendar-wrapper .react-calendar__navigation button:enabled:focus {
              background-color: var(--light-background);
            }
            
            /* Month title display text (e.g., "August 2026") in the navigation header */
            .custom-calendar-wrapper .react-calendar__navigation__label {
               font-weight: 700;
               font-size: 15px;
               color: var(--primary-text);
             }
             
             /* Row wrapper for weekday column headers (MON, TUE, WED...) */
             .custom-calendar-wrapper .react-calendar__month-view__weekdays {
               display: flex;
               text-transform: uppercase;
               font-weight: 700;
               font-size: 11px;
               color: var(--secondary-text);
               margin-bottom: 4px;
               text-align: center;
             }
             
             /* Individual weekday cells */
             .custom-calendar-wrapper .react-calendar__month-view__weekdays__weekday {
               flex: 1;
            }
            
            /* Inner abbreviation element in weekday headers (prevents default browser underline) */
            .custom-calendar-wrapper .react-calendar__month-view__weekdays__weekday abbr {
              text-decoration: none;
              border-bottom: none;
            }
            
            /* Grid container wrapping all active month date cells (7 columns) */
            .custom-calendar-wrapper .react-calendar__month-view__days {
              display: grid !important;
              grid-template-columns: repeat(7, 1fr);
              gap: 1px;
            }
            
            /* Base class for all date cells in the calendar grid */
            .custom-calendar-wrapper .react-calendar__tile {
              padding: 6px 0 !important;
              font-size: 13px;
              font-weight: 500;
              color: var(--primary-text);
              border-radius: var(--radius-sm);
              display: flex;
              align-items: center;
              justify-content: center;
              background: none;
              cursor: pointer;
              border: none;
            }
            
            /* Enforce square ratio only for day tiles in the month view grid */
            .custom-calendar-wrapper .react-calendar__month-view .react-calendar__tile {
              aspect-ratio: 1;
            }
            
            /* Rectangular padding for month and year selection tiles (year/decade views) */
            .custom-calendar-wrapper .react-calendar__year-view .react-calendar__tile,
            .custom-calendar-wrapper .react-calendar__decade-view .react-calendar__tile {
              padding: 12px 0 !important;
              height: 36px;
            }
            
            /* Hover/focus effect for individual selectable dates */
            .custom-calendar-wrapper .react-calendar__tile:enabled:hover,
            .custom-calendar-wrapper .react-calendar__tile:enabled:focus {
              background-color: rgba(0, 130, 250, 0.1);
              color: var(--primary-brand);
            }
            
            /* Highlight styles for the cell representing current calendar date */
            .custom-calendar-wrapper .react-calendar__tile--now {
              background: var(--light-background);
              color: var(--primary-text);
              font-weight: bold;
            }
            
            /* Fully selected dates when a date range matches */
            .custom-calendar-wrapper .react-calendar__tile--active {
              background: var(--brand-gradient) !important;
              color: white !important;
              border-radius: var(--radius-sm);
            }
            
            /* Styles highlighting the start date cell of the chosen date range */
            .custom-calendar-wrapper .react-calendar__tile--rangeStart {
              border-top-left-radius: var(--radius-sm);
              border-bottom-left-radius: var(--radius-sm);
            }
            
            /* Styles highlighting the end date cell of the chosen date range */
            .custom-calendar-wrapper .react-calendar__tile--rangeEnd {
              border-top-right-radius: var(--radius-sm);
              border-bottom-right-radius: var(--radius-sm);
            }
            
            /* Mid-range visual connector cells between selected start and end dates */
            .custom-calendar-wrapper .react-calendar__tile--selectRange {
              background: rgba(0, 130, 250, 0.08) !important;
              color: var(--primary-brand);
              border-radius: 0;
            }
          `}</style>
        </PopoverContent>
      </Popover>

      <button
        onClick={onNext}
        className="flex items-center justify-center size-10 sm:size-11.5 rounded-lg bg-brand-gradient shadow-sm text-white transition-opacity hover:opacity-90 active:scale-[0.98] outline-none shrink-0"
      >
        <FaPlay className="size-2.5 sm:size-3" />
      </button>
    </div>
  );
}
