import { cn } from "@/lib/utils";
import {
  EVENT_COLORS,
  MONTH_BAR_AREA_TOP,
  MONTH_BAR_HEIGHT,
  MONTH_BAR_ROW_STEP,
} from "../constants";
import { formatPointDate, parseDate } from "../utils/dateUtils";

function MonthSpanBar({ segment, row, onEventClick }) {
  const { event, startCol, endCol, showLabel } = segment;
  const colors = EVENT_COLORS[event.color] ?? EVENT_COLORS.info;
  const start = parseDate(event.startDate);
  const colCount = 7;
  const left = (startCol / colCount) * 100;
  const width = ((endCol - startCol + 1) / colCount) * 100;

  return (
    <button
      type="button"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: `${MONTH_BAR_AREA_TOP + row * MONTH_BAR_ROW_STEP}px`,
        height: `${MONTH_BAR_HEIGHT}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event, { x: e.clientX, y: e.clientY });
      }}
      className={cn(
        "absolute flex items-center gap-1.5 px-2 rounded-sm border text-xs leading-none text-gray-700 min-w-0 z-10 box-border",
        "hover:shadow-sm transition-shadow pointer-events-auto overflow-hidden",
        colors.bar,
        colors.barBorder,
      )}
    >
      {showLabel ? (
        <>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", colors.dot)} />
          <span className="text-gray-400 shrink-0 tabular-nums">
            {formatPointDate(start)}
          </span>
          <span className="truncate">{event.title}</span>
        </>
      ) : (
        <span className="sr-only">{event.title}</span>
      )}
    </button>
  );
}

export default MonthSpanBar;
