import { getDaysInMonth, isSameDay, isSpanEvent, parseDate } from "./dateUtils";

export function toDateKey(year, month, day) {
  return `${year}-${month}-${day}`;
}

/** 生成 6 行 × 7 列的月历格（含上月尾、下月头） */
export function buildCalendarWeeks(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstWeekday = new Date(year, month, 1).getDay();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);

  const cells = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    cells.push({
      year: prevYear,
      month: prevMonth,
      day,
      type: "prev",
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year, month, day: d, type: "current" });
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      year: nextYear,
      month: nextMonth,
      day: nextDay++,
      type: "next",
    });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(
      cells.slice(i, i + 7).map((cell) => ({
        ...cell,
        date: new Date(cell.year, cell.month, cell.day),
        key: toDateKey(cell.year, cell.month, cell.day),
      })),
    );
  }
  return weeks;
}

export function eventOverlapsCell(event, cell) {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);
  const d = cell.date;
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  return start <= dayEnd && end >= dayStart;
}

export function getPointEventsForCell(events, cell) {
  return events.filter((e) => {
    if (isSpanEvent(e)) return false;
    const d = parseDate(e.startDate);
    return isSameDay(d, cell.date);
  });
}

export function getVisibleSpanEvents(events, weeks) {
  const first = weeks[0][0].date;
  const last = weeks[weeks.length - 1][6].date;
  return events.filter((e) => {
    if (!isSpanEvent(e)) return false;
    const start = parseDate(e.startDate);
    const end = parseDate(e.endDate);
    return start <= last && end >= first;
  });
}

/** 某周内跨天条片段：起止列索引 */
export function getSpanSegmentInWeek(event, week) {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);
  const weekStart = week[0].date;
  const weekEnd = week[6].date;

  if (end < weekStart || start > weekEnd) return null;

  const segStart = start < weekStart ? weekStart : start;
  const segEnd = end > weekEnd ? weekEnd : end;

  const startCol = week.findIndex((c) => isSameDay(c.date, segStart));
  const endCol = week.findIndex((c) => isSameDay(c.date, segEnd));
  if (startCol < 0 || endCol < 0) return null;

  const showLabel = isSameDay(segStart, start);

  return {
    event,
    startCol,
    endCol,
    showLabel,
  };
}

export function assignWeekBarRows(segments) {
  const sorted = [...segments].sort((a, b) => a.startCol - b.startCol);
  const rows = [];

  return sorted.map((seg) => {
    const left = seg.startCol;
    const right = seg.endCol + 1;
    let row = 0;
    while (rows[row]?.some((s) => !(right <= s.left || left >= s.right))) {
      row += 1;
    }
    if (!rows[row]) rows[row] = [];
    rows[row].push({ left, right });
    return { ...seg, row };
  });
}

export function getAllEventsForCell(events, cell) {
  return events.filter((e) => eventOverlapsCell(e, cell));
}
