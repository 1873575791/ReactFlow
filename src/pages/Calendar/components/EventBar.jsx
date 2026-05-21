import { cn } from "@/lib/utils";
import { EVENT_COLORS } from "../constants";
import { formatPointDate, parseDate } from "../utils/dateUtils";

function EventBar({ event, style, rowOffset, onEventClick }) {
  const colors = EVENT_COLORS[event.color] ?? EVENT_COLORS.info;
  const start = parseDate(event.startDate);

  return (
    <button
      type="button"
      style={{
        ...style,
        top: `calc(${rowOffset * 28 + 36}px)`,
      }}
      onClick={(e) =>
        onEventClick(event, {
          x: e.clientX,
          y: e.clientY,
        })
      }
      className={cn(
        "absolute flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs text-gray-700",
        "hover:shadow-sm transition-shadow z-10 min-w-0",
        colors.bar,
        colors.barBorder,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", colors.dot)} />
      <span className="text-gray-400 shrink-0 tabular-nums">
        {formatPointDate(start)}
      </span>
      <span className="truncate">{event.title}</span>
    </button>
  );
}

export default EventBar;
