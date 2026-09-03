import { useState } from "react";
import Icon from "./Icons";

export default function TaskDialog({ task, members, projects, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...task });
  const isNew = task.id === "new";

  const submit = (event) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section className="task-dialog" role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="task-dialog__header">
          <div><small>{isNew ? "CREATE TASK" : "TASK DETAILS"}</small><h2 id="task-dialog-title">{isNew ? "新建排期任务" : "编辑任务详情"}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭"><Icon name="close" /></button>
        </div>
        <form onSubmit={submit}>
          <label>项目<select value={draft.projectId} onChange={(event) => setDraft({ ...draft, projectId: event.target.value })}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          <label>负责人<select value={draft.memberId} onChange={(event) => setDraft({ ...draft, memberId: event.target.value })}>{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.role}</option>)}</select></label>
          <div className="dialog-form-row">
            <label>开始日期<input type="date" required value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} /></label>
            <label>结束日期<input type="date" required min={draft.start} value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} /></label>
          </div>
          <label>任务状态<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="planned">规划中</option><option value="confirmed">已确认</option></select></label>
          <div className="task-dialog__footer">
            <button type="button" className="ghost-button" onClick={onClose}>取消</button>
            <button type="submit" className="primary-button">{isNew ? "创建任务" : "保存修改"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
