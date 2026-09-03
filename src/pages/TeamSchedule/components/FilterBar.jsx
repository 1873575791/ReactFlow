function SelectFilter({ label, value, options, onChange }) {
  return (
    <label className="filter-select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">全部{label}</option>
        {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export default function FilterBar({ filters, roles, projects, members, count, taskCount, onChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__controls">
        <SelectFilter label="角色" value={filters.role} options={roles.map((role) => ({ value: role, label: role }))} onChange={(role) => onChange({ ...filters, role })} />
        <SelectFilter label="项目" value={filters.project} options={projects.map((project) => ({ value: project.id, label: project.name }))} onChange={(project) => onChange({ ...filters, project })} />
        <SelectFilter label="人员" value={filters.member} options={members.map((member) => ({ value: member.id, label: member.name }))} onChange={(member) => onChange({ ...filters, member })} />
      </div>
      <p>共 {count} 名成员 · {taskCount} 条任务 · 数据每5分钟自动同步</p>
    </div>
  );
}

