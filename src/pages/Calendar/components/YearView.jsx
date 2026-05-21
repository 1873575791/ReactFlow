import { useMemo } from "react";
import { MONTH_NAMES } from "../constants";
import {
  getMonthPointEvents,
  getSpanBarMetrics,
  getYearSpanEvents,
} from "../utils/dateUtils";
import MonthBlock from "./MonthBlock";
import EventBar from "./EventBar";

/** 为跨月条分配垂直轨道，避免重叠 */
function assignBarRows(spanEvents, year) {
  const rows = [];
  const metricsList = spanEvents
    .map((event) => ({ event, metrics: getSpanBarMetrics(event, year) }))
    .filter((x) => x.metrics);

  metricsList.sort((a, b) => {
    const leftA = parseFloat(a.metrics.left);
    const leftB = parseFloat(b.metrics.left);
    return leftA - leftB;
  });

  return metricsList.map(({ event, metrics }) => {
    const left = parseFloat(metrics.left);
    const width = parseFloat(metrics.width);
    const right = left + width;

    let row = 0;
    while (
      rows[row]?.some((slot) => !(right <= slot.left || left >= slot.right))
    ) {
      row += 1;
    }
    if (!rows[row]) rows[row] = [];
    rows[row].push({ left, right });
    return { event, metrics, row };
  });
}

function YearSection({ year, events, onEventClick }) {
  const spanBars = useMemo(
    () => assignBarRows(getYearSpanEvents(events, year), year),
    [events, year],
  );

  const maxBarRow = spanBars.reduce((max, b) => Math.max(max, b.row), -1);
  const extraHeight = maxBarRow >= 0 ? (maxBarRow + 1) * 28 : 0;

  return (
    <section className="mb-2">
      <h2 className="text-sm font-medium text-gray-700 px-6 py-3 bg-gray-50/80 border-b border-gray-100">
        {year}年
      </h2>
      <div
        className="relative mx-6 my-4 border border-gray-100 rounded-sm overflow-hidden"
        style={{ minHeight: 140 * 3 + extraHeight }}
      >
        <div className="grid grid-cols-4">
          {MONTH_NAMES.map((name, index) => (
            <MonthBlock
              key={`${year}-${index}`}
              monthName={name}
              events={getMonthPointEvents(events, year, index)}
              onEventClick={onEventClick}
            />
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none">
          {spanBars.map(({ event, metrics, row }) => (
            <EventBar
              key={event.id}
              event={event}
              rowOffset={metrics.startRow * 3 + row}
              style={{
                left: metrics.left,
                width: metrics.width,
                pointerEvents: "auto",
              }}
              onEventClick={onEventClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function YearView({ baseYear, events, onEventClick }) {
  return (
    <div className="overflow-y-auto h-full bg-white">
      <YearSection
        year={baseYear}
        events={events}
        onEventClick={onEventClick}
      />
      <YearSection
        year={baseYear + 1}
        events={events}
        onEventClick={onEventClick}
      />
    </div>
  );
}

export default YearView;
