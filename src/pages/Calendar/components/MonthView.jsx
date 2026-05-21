import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  EVENT_COLORS,
  MONTH_BAR_AREA_TOP,
  MONTH_BAR_HEIGHT,
  MONTH_BAR_ROW_STEP,
  MONTH_CELL_MAX_POINT_EVENTS,
  MONTH_CELL_MIN_HEIGHT,
  WEEKDAY_LABELS,
} from "../constants";
import { formatPointDate, parseDate } from "../utils/dateUtils";
import {
  assignWeekBarRows,
  buildCalendarWeeks,
  getPointEventsForCell,
  getSpanSegmentInWeek,
  getVisibleSpanEvents,
} from "../utils/monthViewUtils";
import MonthSpanBar from "./MonthSpanBar";
import DayEventList from "./DayEventList";

function MonthView({ year, month, events, onEventClick }) {
  const weeks = useMemo(() => buildCalendarWeeks(year, month), [year, month]);
  const spanEvents = useMemo(
    () => getVisibleSpanEvents(events, weeks),
    [events, weeks],
  );

  const [dayPanel, setDayPanel] = useState(null);
  const [dayPanelSelectedId, setDayPanelSelectedId] = useState(null);

  const weekBarData = useMemo(() => {
    return weeks.map((week) => {
      const segments = spanEvents
        .map((event) => getSpanSegmentInWeek(event, week))
        .filter(Boolean);
      return assignWeekBarRows(segments);
    });
  }, [weeks, spanEvents]);

  const handleDayClick = (cell, e) => {
    const pointEvents = getPointEventsForCell(events, cell);
    if (pointEvents.length <= MONTH_CELL_MAX_POINT_EVENTS) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setDayPanel({
      day: cell.day,
      events: pointEvents,
      anchor: { x: rect.right + 4, y: rect.top },
    });
    setDayPanelSelectedId(pointEvents[0]?.id ?? null);
  };

  const handleDayPanelSelect = (event) => {
    setDayPanelSelectedId(event.id);
    onEventClick(event, {
      x: dayPanel.anchor.x,
      y: dayPanel.anchor.y + 40,
    });
  };

  const closeDayPanel = () => {
    setDayPanel(null);
    setDayPanelSelectedId(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-white px-6 py-4">
      <div className="border border-gray-100 rounded-sm">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/80">
          {WEEKDAY_LABELS.map((w) => (
            <div
              key={w}
              className="text-center text-xs text-gray-500 py-2.5 font-medium"
            >
              {w}
            </div>
          ))}
        </div>

        {weeks.map((week, weekIndex) => {
          const maxBarRows = weekBarData[weekIndex].length
            ? Math.max(...weekBarData[weekIndex].map((s) => s.row + 1))
            : 0;
          const barAreaHeight =
            maxBarRows > 0
              ? (maxBarRows - 1) * MONTH_BAR_ROW_STEP + MONTH_BAR_HEIGHT
              : 0;
          const eventsTop = MONTH_BAR_AREA_TOP + barAreaHeight + 6;
          const weekMinHeight = Math.max(
            MONTH_CELL_MIN_HEIGHT,
            MONTH_BAR_AREA_TOP + barAreaHeight + 48,
          );

          return (
            <div
              key={weekIndex}
              className="relative grid grid-cols-7 border-b border-gray-100 last:border-b-0 overflow-visible"
              style={{ minHeight: weekMinHeight }}
            >
            {week.map((cell) => {
              const pointEvents = getPointEventsForCell(events, cell);
              const visiblePoints = pointEvents.slice(
                0,
                MONTH_CELL_MAX_POINT_EVENTS,
              );
              const isCurrent = cell.type === "current";

              return (
                <div
                  key={cell.key}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDayClick(cell, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleDayClick(cell, e);
                  }}
                  className={cn(
                    "relative border-r border-gray-100 last:border-r-0 p-2 min-h-full cursor-default",
                    cell.type === "next" && "bg-sky-50/40",
                    cell.type === "prev" && "bg-white",
                    cell.type === "current" && "bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "text-xs mb-1",
                      isCurrent ? "text-gray-700" : "text-gray-300",
                    )}
                  >
                    {cell.day}
                  </div>

                  <div
                    className="relative space-y-0.5"
                    style={{ marginTop: eventsTop }}
                  >
                    {visiblePoints.map((event) => {
                      const colors =
                        EVENT_COLORS[event.color] ?? EVENT_COLORS.info;
                      const date = parseDate(event.startDate);
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onEventClick(event, {
                              x: ev.clientX,
                              y: ev.clientY,
                            });
                          }}
                          className="w-full flex items-center gap-1.5 text-left text-xs leading-5 min-h-[22px] hover:bg-gray-50 rounded px-1 py-0.5 -mx-0.5 transition-colors"
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              colors.dot,
                            )}
                          />
                          <span className="text-gray-400 shrink-0 tabular-nums">
                            {formatPointDate(date)}
                          </span>
                          <span className="truncate text-gray-600">
                            {event.title}
                          </span>
                        </button>
                      );
                    })}
                    {pointEvents.length > MONTH_CELL_MAX_POINT_EVENTS && (
                      <div className="text-[10px] text-gray-400 pl-3">
                        +{pointEvents.length - MONTH_CELL_MAX_POINT_EVENTS} 更多
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
              {weekBarData[weekIndex].map((segment) => (
                <MonthSpanBar
                  key={`${segment.event.id}-${segment.startCol}-${weekIndex}`}
                  segment={segment}
                  row={segment.row}
                  onEventClick={onEventClick}
                />
              ))}
            </div>
            </div>
          );
        })}
      </div>

      {dayPanel && (
        <DayEventList
          day={dayPanel.day}
          events={dayPanel.events}
          selectedId={dayPanelSelectedId}
          anchor={dayPanel.anchor}
          onSelect={handleDayPanelSelect}
          onClose={closeDayPanel}
        />
      )}
    </div>
  );
}

export default MonthView;
