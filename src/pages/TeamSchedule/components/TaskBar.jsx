export default function TaskBar({ task, project, style, onClick }) {
  return (
    <button
      type="button"
      className={`task-bar task-${project.color} ${task.status === "planned" ? "is-planned" : "is-confirmed"}`}
      style={style}
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/task-id", String(task.id))}
      onClick={() => onClick(task)}
      title={`${project.name}（拖拽可调整排期）`}
    >
      {project.name}
    </button>
  );
}

