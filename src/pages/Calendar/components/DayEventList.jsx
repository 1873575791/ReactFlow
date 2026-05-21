import { cn } from "@/lib/utils";
import { EVENT_COLORS } from "../constants";
import { formatPointDate, parseDate } from "../utils/dateUtils";

function DayEventList({
  day,
  events,
  selectedId,
  anchor,
  onSelect,
  onClose,
}) {
  if (!anchor) return null;

  const style = {
    position: "fixed",
    left: Math.min(anchor.x, window.innerWidth - 240),
    top: Math.min(anchor.y, window.innerHeight - 280),
    zIndex: 50,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        style={style}
        className="z-50 w-[220px] rounded-md shadow-lg border border-gray-100 bg-white overflow-hidden"
        role="listbox"
      >
        <div className="px-3 py-2 text-sm font-medium text-gray-800 border-b border-gray-100">
          {String(day).padStart(2, "0")}
        </div>
        <ul className="max-h-[240px] overflow-y-auto py-1">
          {events.map((event) => {
            const colors = EVENT_COLORS[event.color] ?? EVENT_COLORS.info;
            const date = parseDate(event.startDate);
            const isSelected = event.id === selectedId;

            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelect(event)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    isSelected
                      ? "bg-orange-500 text-white"
                      : "text-gray-700 hover:bg-gray-50",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      isSelected ? "bg-white" : colors.dot,
                    )}
                  />
                  <span
                    className={cn(
                      "shrink-0 tabular-nums",
                      isSelected ? "text-white/90" : "text-gray-400",
                    )}
                  >
                    {formatPointDate(date)}
                  </span>
                  <span className="truncate">{event.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default DayEventList;
