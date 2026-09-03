export const TEAM_MEMBERS = [
  { id: "zhou", name: "周雨桐", role: "统筹", initials: "周", tone: "indigo" },
  { id: "chen", name: "陈凯文", role: "导演", initials: "陈", tone: "violet" },
  { id: "he", name: "何嘉树", role: "美术", initials: "何", tone: "cyan" },
  { id: "lin", name: "林小满", role: "美术", initials: "林", tone: "lime" },
  { id: "li", name: "李思远", role: "制作", initials: "李", tone: "pink" },
  { id: "wang", name: "王一鸣", role: "制作", initials: "王", tone: "red" },
  { id: "zhao", name: "赵子墨", role: "后期", initials: "赵", tone: "cyan" },
  { id: "su", name: "苏晚晴", role: "调色", initials: "苏", tone: "lime" },
];

export const PROJECTS = [
  { id: "chang-an", name: "长安十二夜", color: "purple" },
  { id: "mountain", name: "山海经·异兽录", color: "green" },
  { id: "dunhuang", name: "敦煌飞天", color: "orange" },
  { id: "liaozhai", name: "聊斋新编", color: "red" },
  { id: "journey", name: "西游·暗黑篇", color: "violet" },
  { id: "snake", name: "白蛇·缘起", color: "cyan" },
];

export const INITIAL_TASKS = [
  { id: 1, memberId: "zhou", projectId: "mountain", start: "2026-07-25", end: "2026-07-26", status: "planned" },
  { id: 2, memberId: "chen", projectId: "chang-an", start: "2026-07-20", end: "2026-07-22", status: "confirmed" },
  { id: 3, memberId: "chen", projectId: "dunhuang", start: "2026-07-23", end: "2026-07-26", status: "planned" },
  { id: 4, memberId: "he", projectId: "liaozhai", start: "2026-07-20", end: "2026-07-23", status: "planned" },
  { id: 5, memberId: "he", projectId: "mountain", start: "2026-07-20", end: "2026-07-24", status: "confirmed" },
  { id: 6, memberId: "lin", projectId: "mountain", start: "2026-07-20", end: "2026-07-23", status: "confirmed" },
  { id: 7, memberId: "lin", projectId: "liaozhai", start: "2026-07-24", end: "2026-07-26", status: "planned" },
  { id: 8, memberId: "lin", projectId: "chang-an", start: "2026-07-22", end: "2026-07-26", status: "confirmed" },
  { id: 9, memberId: "li", projectId: "liaozhai", start: "2026-07-20", end: "2026-07-22", status: "confirmed" },
  { id: 10, memberId: "li", projectId: "snake", start: "2026-07-23", end: "2026-07-24", status: "confirmed" },
  { id: 11, memberId: "li", projectId: "mountain", start: "2026-07-25", end: "2026-07-26", status: "planned" },
  { id: 12, memberId: "wang", projectId: "dunhuang", start: "2026-07-20", end: "2026-07-22", status: "confirmed" },
  { id: 13, memberId: "wang", projectId: "chang-an", start: "2026-07-22", end: "2026-07-24", status: "confirmed" },
  { id: 14, memberId: "wang", projectId: "journey", start: "2026-07-25", end: "2026-07-26", status: "planned" },
  { id: 15, memberId: "zhao", projectId: "journey", start: "2026-07-21", end: "2026-07-24", status: "confirmed" },
  { id: 16, memberId: "zhao", projectId: "chang-an", start: "2026-07-25", end: "2026-07-26", status: "planned" },
  { id: 17, memberId: "su", projectId: "snake", start: "2026-07-20", end: "2026-07-21", status: "confirmed" },
  { id: 18, memberId: "su", projectId: "dunhuang", start: "2026-07-22", end: "2026-07-25", status: "planned" },
];

