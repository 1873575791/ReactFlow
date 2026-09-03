import { useMemo } from "react";
import { differenceInDays, fromISODate, isSameDay, toISODate } from "../dateUtils";
import MemberCell from "./MemberCell";
import TaskBar from "./TaskBar";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

function positionTask(task, firstDay, lastDay, dayCount, lane) {
  const originalStart = fromISODate(task.start);
  const originalEnd = fromISODate(task.end);
  if (originalEnd < firstDay || originalStart > lastDay) return null;
  const visibleStart = originalStart < firstDay ? firstDay : originalStart;
  const visibleEnd = originalEnd > lastDay ? lastDay : originalEnd;
  const offset = differenceInDays(visibleStart, firstDay);
  const length = differenceInDays(visibleEnd, visibleStart) + 1;
  return {
    left: `calc(${(offset / dayCount) * 100}% + 3px)`,
    width: `calc(${(length / dayCount) * 100}% - 6px)`,
    top: lane === 0 ? 10 : 41,
  };
}

function assignTaskLanes(tasks) {
  const laneEnds = [];
  return [...tasks]
    .sort((left, right) => left.start.localeCompare(right.start))
    .map((task) => {
      let lane = laneEnds.findIndex((end) => end < task.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = task.end;
      return { task, lane: Math.min(lane, 1) };
    });
}

export default function ScheduleGrid({ days, members, projects, tasks, today, onTaskClick, onMoveTask }) {
  const projectMap = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project])), [projects]);
  const minDayWidth = days.length > 7 ? 112 : 145;
  const innerMinWidth = 258 + days.length * minDayWidth;
  const firstDay = days[0];
  const lastDay = days[days.length - 1];

  const handleDrop = (event, memberId) => {
    event.preventDefault();
    const taskId = Number(event.dataTransfer.getData("text/task-id"));
    if (!taskId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const index = Math.max(0, Math.min(days.length - 1, Math.floor(((event.clientX - bounds.left) / bounds.width) * days.length)));
    onMoveTask(taskId, memberId, toISODate(days[index]));
  };

  return (
    <div className="schedule-grid" role="grid" aria-label="人员项目排期表">
      <div className="schedule-grid__inner" style={{ minWidth: innerMinWidth }}>
        <div className="schedule-grid__header" role="row">
          <div className="schedule-grid__corner" role="columnheader">成员 / 角色</div>
          <div className="schedule-grid__days" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(${minDayWidth}px, 1fr))` }}>
            {days.map((day) => (
              <div key={toISODate(day)} className={`day-heading ${isSameDay(day, today) ? "is-today" : ""}`} role="columnheader">
                <span>{WEEKDAYS[day.getDay()]}</span>
                <strong>{String(day.getMonth() + 1).padStart(2, "0")}.{String(day.getDate()).padStart(2, "0")}</strong>
                {isSameDay(day, today) && <em>今天</em>}
              </div>
            ))}
          </div>
        </div>

        {members.map((member) => {
          const memberTasks = assignTaskLanes(tasks.filter((task) => task.memberId === member.id));
          return (
            <div className="schedule-grid__row" key={member.id} role="row">
              <MemberCell member={member} />
              <div
                className="schedule-grid__timeline"
                style={{ backgroundSize: `${100 / days.length}% 100%` }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, member.id)}
              >
                {days.map((day, index) => isSameDay(day, today) && <span key={toISODate(day)} className="today-column" style={{ left: `${index / days.length * 100}%`, width: `${100 / days.length}%` }} />)}
                {memberTasks.map(({ task, lane }) => {
                  const style = positionTask(task, firstDay, lastDay, days.length, lane);
                  return style && <TaskBar key={task.id} task={task} project={projectMap[task.projectId]} style={style} onClick={onTaskClick} />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
