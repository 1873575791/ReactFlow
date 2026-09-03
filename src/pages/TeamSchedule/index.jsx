import { useMemo, useRef, useState } from "react";
import FilterBar from "./components/FilterBar";
import ScheduleGrid from "./components/ScheduleGrid";
import ScheduleLegend from "./components/ScheduleLegend";
import ScheduleToolbar from "./components/ScheduleToolbar";
import TaskDialog from "./components/TaskDialog";
import { INITIAL_TASKS, PROJECTS, TEAM_MEMBERS } from "./data";
import { addDays, addMonths, differenceInDays, formatPeriod, fromISODate, getVisibleDays, startOfWeek, toISODate } from "./dateUtils";
import "./schedule.css";

const DEMO_TODAY = new Date(2026, 6, 23);

export default function TeamSchedulePage() {
  const [viewMode, setViewMode] = useState("week");
  const [anchorDate, setAnchorDate] = useState(new Date(2026, 6, 20));
  const [filters, setFilters] = useState({ role: "all", project: "all", member: "all" });
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [activeTask, setActiveTask] = useState(null);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef(null);
  const days = useMemo(() => getVisibleDays(anchorDate, viewMode), [anchorDate, viewMode]);

  const visibleMembers = TEAM_MEMBERS.filter((member) => {
    if (filters.role !== "all" && member.role !== filters.role) return false;
    if (filters.member !== "all" && member.id !== filters.member) return false;
    if (filters.project !== "all" && !tasks.some((task) => task.memberId === member.id && task.projectId === filters.project)) return false;
    return true;
  });
  const visibleTasks = tasks.filter((task) => {
    const memberVisible = visibleMembers.some((member) => member.id === task.memberId);
    const projectVisible = filters.project === "all" || task.projectId === filters.project;
    return memberVisible && projectVisible;
  });
  const roles = [...new Set(TEAM_MEMBERS.map((member) => member.role))];

  const shiftPeriod = (direction) => {
    setAnchorDate((date) => viewMode === "week" ? addDays(date, direction * 7) : addMonths(date, direction));
  };

  const openCreateDialog = () => {
    const date = toISODate(days[0]);
    setActiveTask({ id: "new", memberId: visibleMembers[0]?.id || TEAM_MEMBERS[0].id, projectId: PROJECTS[0].id, start: date, end: date, status: "planned" });
  };

  const saveTask = (draft) => {
    if (fromISODate(draft.end) < fromISODate(draft.start)) return;
    if (draft.id === "new") {
      setTasks((current) => [...current, { ...draft, id: Date.now() }]);
      setNotice("任务已创建");
    } else {
      setTasks((current) => current.map((task) => task.id === draft.id ? draft : task));
      setNotice("排期已更新");
    }
    setActiveTask(null);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const moveTask = (taskId, memberId, start) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== taskId) return task;
      const duration = differenceInDays(fromISODate(task.end), fromISODate(task.start));
      return { ...task, memberId, start, end: toISODate(addDays(fromISODate(start), duration)) };
    }));
    setNotice("排期已移动");
    window.setTimeout(() => setNotice(""), 1800);
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setNotice(`已读取 ${file.name}`);
    window.setTimeout(() => setNotice(""), 2500);
    event.target.value = "";
  };

  return (
    <div className="team-schedule-page">
      <ScheduleToolbar
        viewMode={viewMode}
        period={formatPeriod(days, viewMode)}
        onViewChange={setViewMode}
        onPrevious={() => shiftPeriod(-1)}
        onNext={() => shiftPeriod(1)}
        onToday={() => setAnchorDate(startOfWeek(DEMO_TODAY))}
        onImport={() => fileInputRef.current?.click()}
        onCreate={openCreateDialog}
      />
      <input ref={fileInputRef} className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />
      <FilterBar filters={filters} roles={roles} projects={PROJECTS} members={TEAM_MEMBERS} count={visibleMembers.length} taskCount={visibleTasks.length} onChange={setFilters} />
      <div className="schedule-content">
        <ScheduleGrid days={days} members={visibleMembers} projects={PROJECTS} tasks={visibleTasks} today={DEMO_TODAY} onTaskClick={setActiveTask} onMoveTask={moveTask} />
      </div>
      <ScheduleLegend projects={PROJECTS} />
      {activeTask && <TaskDialog key={activeTask.id} task={activeTask} members={TEAM_MEMBERS} projects={PROJECTS} onClose={() => setActiveTask(null)} onSave={saveTask} />}
      {notice && <div className="schedule-toast" role="status">✓ {notice}</div>}
    </div>
  );
}
