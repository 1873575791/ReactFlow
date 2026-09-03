export default function ScheduleLegend({ projects }) {
  return (
    <footer className="schedule-legend">
      <div className="schedule-legend__projects">
        {projects.map((project) => <span key={project.id}><i className={`legend-dot task-${project.color}`} />{project.name}</span>)}
      </div>
      <div className="schedule-legend__states">
        <span><i className="state-sample planned" />规划中</span>
        <span><i className="state-sample confirmed" />已确认</span>
        <span className="legend-help">拖拽色块：水平改日期 · 垂直换人员 · 点击看详情</span>
      </div>
    </footer>
  );
}

