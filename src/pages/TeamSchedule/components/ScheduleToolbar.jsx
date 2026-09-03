import Icon from "./Icons";
import ViewToggle from "./ViewToggle";

export default function ScheduleToolbar({ viewMode, period, onViewChange, onPrevious, onNext, onToday, onImport, onCreate }) {
  return (
    <header className="schedule-toolbar">
      <div className="schedule-toolbar__primary">
        <h1>项目人员管理</h1>
        <ViewToggle value={viewMode} onChange={onViewChange} />
        <div className="period-navigation">
          <button type="button" className="ghost-button" onClick={onPrevious}><Icon name="left" />上{viewMode === "week" ? "周" : "月"}</button>
          <strong>{period}</strong>
          <button type="button" className="ghost-button" onClick={onNext}>下{viewMode === "week" ? "周" : "月"}<Icon name="right" /></button>
          <button type="button" className="today-button" onClick={onToday}>今天</button>
        </div>
      </div>
      <div className="schedule-toolbar__actions">
        <span className="workspace-pill">▦&nbsp; AI剧作工坊 · 内容创作事业部 <Icon name="lock" size={14} /></span>
        <button type="button" className="ghost-button" onClick={onImport}><Icon name="upload" />Excel导入</button>
        <button type="button" className="primary-button" onClick={onCreate}><Icon name="plus" />新建任务</button>
      </div>
    </header>
  );
}

