export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfWeek(date) {
  const result = new Date(date);
  const weekday = result.getDay() || 7;
  result.setDate(result.getDate() - weekday + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function addMonths(date, amount) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function differenceInDays(left, right) {
  const utcLeft = Date.UTC(left.getFullYear(), left.getMonth(), left.getDate());
  const utcRight = Date.UTC(right.getFullYear(), right.getMonth(), right.getDate());
  return Math.round((utcLeft - utcRight) / DAY_MS);
}

export function getVisibleDays(anchorDate, viewMode) {
  const start = startOfWeek(anchorDate);
  const count = viewMode === "week" ? 7 : 28;
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function formatPeriod(days, viewMode) {
  const start = days[0];
  const end = days[days.length - 1];
  if (viewMode === "month") {
    return `${start.getFullYear()}年 ${String(start.getMonth() + 1).padStart(2, "0")}月`;
  }
  return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")} – ${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
}

export function isSameDay(left, right) {
  return toISODate(left) === toISODate(right);
}

