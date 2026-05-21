export const MONTH_NAMES = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

export const GRID_COLS = 4;
export const GRID_ROWS = 3;

export const EVENT_COLORS = {
  success: {
    dot: "bg-emerald-500",
    bar: "bg-emerald-100",
    barBorder: "border-emerald-200",
    header: "bg-emerald-500",
    levelBadge: "bg-amber-400",
  },
  warning: {
    dot: "bg-orange-400",
    bar: "bg-orange-50",
    barBorder: "border-orange-200",
    header: "bg-orange-500",
    levelBadge: "bg-amber-400",
  },
  info: {
    dot: "bg-sky-500",
    bar: "bg-sky-100",
    barBorder: "border-sky-200",
    header: "bg-sky-500",
    levelBadge: "bg-amber-400",
  },
  pink: {
    dot: "bg-pink-400",
    bar: "bg-pink-100",
    barBorder: "border-pink-200",
    header: "bg-pink-500",
    levelBadge: "bg-amber-400",
  },
};

export const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

/** 月视图单元格最多展示的单日事件条数，超出则点击日期查看列表 */
export const MONTH_CELL_MAX_POINT_EVENTS = 2;

/** 月视图跨天条布局（避免无内容时高度塌缩） */
export const MONTH_BAR_HEIGHT = 22;
export const MONTH_BAR_ROW_STEP = 26;
export const MONTH_BAR_AREA_TOP = 26;
export const MONTH_CELL_MIN_HEIGHT = 120;

export const VIEW_MODES = {
  MONTH: "month",
  YEAR: "year",
};
