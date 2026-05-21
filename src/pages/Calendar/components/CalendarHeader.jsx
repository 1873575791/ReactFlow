import { cn } from "@/lib/utils";
import { VIEW_MODES } from "../constants";

function CalendarHeader({
  year,
  month,
  viewMode,
  onYearChange,
  onMonthChange,
  onViewModeChange,
}) {
  const isMonthView = viewMode === VIEW_MODES.MONTH;

  const handlePrev = () => {
    if (isMonthView && month === 0) {
      onYearChange(year - 1);
      onMonthChange(11);
    } else if (isMonthView) {
      onMonthChange(month - 1);
    } else {
      onYearChange(year - 1);
    }
  };

  const handleNext = () => {
    if (isMonthView && month === 11) {
      onYearChange(year + 1);
      onMonthChange(0);
    } else if (isMonthView) {
      onMonthChange(month + 1);
    } else {
      onYearChange(year + 1);
    }
  };

  const label = isMonthView
    ? `${year}年${month + 1}月`
    : `${year}年`;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="上一年"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 3L5 8l5 5" />
          </svg>
        </button>
        <span className="text-base font-medium text-gray-800 min-w-[100px] text-center">
          {label}
        </span>
        <button
          type="button"
          onClick={handleNext}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="下一年"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 3l5 5-5 5" />
          </svg>
        </button>
      </div>

      <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => onViewModeChange(VIEW_MODES.MONTH)}
          className={cn(
            "px-4 py-1.5 transition-colors",
            viewMode === VIEW_MODES.MONTH
              ? "bg-sky-100 text-sky-600"
              : "bg-white text-gray-600 hover:bg-gray-50",
          )}
        >
          月
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange(VIEW_MODES.YEAR)}
          className={cn(
            "px-4 py-1.5 transition-colors border-l border-gray-200",
            viewMode === VIEW_MODES.YEAR
              ? "bg-sky-100 text-sky-600"
              : "bg-white text-gray-600 hover:bg-gray-50",
          )}
        >
          年
        </button>
      </div>
    </div>
  );
}

export default CalendarHeader;
