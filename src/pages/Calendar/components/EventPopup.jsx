import { cn } from "@/lib/utils";
import { EVENT_COLORS } from "../constants";
import { formatRangeLabel, parseDate } from "../utils/dateUtils";

const ACTION_ICONS = [
  {
    key: "view",
    label: "查看",
    path: "M10 12a2 2 0 100-4 2 2 0 000 4zM3 12a9 9 0 1118 0 9 9 0 01-18 0z",
  },
  {
    key: "edit",
    label: "编辑",
    path: "M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  },
  {
    key: "delete",
    label: "删除",
    path: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
  },
  {
    key: "status",
    label: "状态",
    path: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  },
];

function EventPopup({ event, anchor, onClose }) {
  if (!event || !anchor) return null;

  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);
  const colors = EVENT_COLORS[event.color] ?? EVENT_COLORS.warning;

  const style = {
    position: "fixed",
    left: Math.min(anchor.x, window.innerWidth - 320),
    top: Math.min(anchor.y + 8, window.innerHeight - 260),
    zIndex: 50,
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div
        style={style}
        className="z-50 w-[300px] rounded-lg shadow-xl overflow-hidden bg-white"
        role="dialog"
      >
        <div className={cn("px-4 py-3 text-white", colors.header)}>
          <div className="font-medium text-sm leading-snug line-clamp-2">
            {event.title}
          </div>
          <div className="text-xs mt-1 opacity-90">
            {formatRangeLabel(start, end)}
          </div>
        </div>

        <div className="px-4 py-3 text-sm text-gray-600 space-y-2.5">
          <div className="flex gap-2">
            <span className="text-gray-400 shrink-0">活动主题：</span>
            <span className="text-gray-700">{event.theme}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 shrink-0">活动级别：</span>
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[22px] h-[22px] px-1 rounded text-white text-xs font-medium",
                colors.levelBadge,
              )}
            >
              {event.level}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-around px-4 py-3 border-t border-gray-100">
          {ACTION_ICONS.map((icon) => (
            <button
              key={icon.key}
              type="button"
              title={icon.label}
              className="p-2 text-sky-500 hover:bg-sky-50 rounded transition-colors"
              onClick={onClose}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={icon.path} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default EventPopup;
