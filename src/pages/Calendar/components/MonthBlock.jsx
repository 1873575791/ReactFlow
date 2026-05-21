import { cn } from "@/lib/utils";
import { EVENT_COLORS } from "../constants";
import { formatPointDate, parseDate } from "../utils/dateUtils";

function MonthBlock({ monthName, events, onEventClick }) {
  return (
    <div className="border-r border-b border-gray-100 p-3 min-h-[140px] flex flex-col">
      <div className="text-xs text-gray-500 mb-2 font-medium">{monthName}</div>
      <div className="flex flex-col gap-1.5 flex-1">
        {events.map((event) => {
          const colors = EVENT_COLORS[event.color] ?? EVENT_COLORS.info;
          const date = parseDate(event.startDate);
          return (
            <button
              key={event.id}
              type="button"
              onClick={(e) =>
                onEventClick(event, {
                  x: e.clientX,
                  y: e.clientY,
                })
              }
              className="flex items-center gap-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 rounded px-0.5 py-0.5 -mx-0.5 transition-colors group"
            >
              <span
                className={cn("w-1.5 h-1.5 rounded-full shrink-0", colors.dot)}
              />
              <span className="text-gray-400 shrink-0 tabular-nums">
                {formatPointDate(date)}
              </span>
              <span className="truncate text-gray-600 group-hover:text-gray-900">
                {event.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MonthBlock;
