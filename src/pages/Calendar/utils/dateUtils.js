export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatPointDate(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${m}.${d}`;
}

export function formatRangeLabel(start, end) {
  const fmt = (d) => `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${fmt(start)} - ${fmt(end)}`;
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSpanEvent(event) {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);
  if (isSameDay(start, end)) return false;
  return true;
}

export function eventInMonth(event, year, month) {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  return start <= monthEnd && end >= monthStart;
}

export function getMonthPointEvents(events, year, month) {
  return events.filter((e) => {
    if (isSpanEvent(e)) return false;
    const d = parseDate(e.startDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getYearSpanEvents(events, year) {
  return events.filter((e) => {
    if (!isSpanEvent(e)) return false;
    const start = parseDate(e.startDate);
    const end = parseDate(e.endDate);
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    return start <= yearEnd && end >= yearStart;
  });
}

/** 计算跨月条在年视图网格中的 left / width（百分比） */
export function getSpanBarMetrics(event, year) {
  const start = parseDate(event.startDate);
  const end = parseDate(event.endDate);

  const clampStart =
    start.getFullYear() < year
      ? new Date(year, 0, 1)
      : start.getFullYear() > year
        ? null
        : start;
  const clampEnd =
    end.getFullYear() > year
      ? new Date(year, 11, 31)
      : end.getFullYear() < year
        ? null
        : end;

  if (!clampStart || !clampEnd) return null;

  const startMonth = clampStart.getMonth();
  const endMonth = clampEnd.getMonth();
  const startDays = getDaysInMonth(year, startMonth);
  const endDays = getDaysInMonth(year, endMonth);

  const startFraction = (clampStart.getDate() - 1) / startDays;
  const endFraction = clampEnd.getDate() / endDays;

  const cellW = 100 / 4;
  const left = startMonth % 4 * cellW + startFraction * cellW;
  const right = (endMonth % 4) * cellW + endFraction * cellW;

  const startRow = Math.floor(startMonth / 4);
  const endRow = Math.floor(endMonth / 4);

  return {
    left: `${left}%`,
    width: `${Math.max(right - left, 2)}%`,
    startRow,
    endRow,
  };
}
