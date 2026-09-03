export default function ViewToggle({ value, onChange }) {
  return (
    <div className="view-toggle" aria-label="切换排期视图">
      <button type="button" className={value === "week" ? "active" : ""} onClick={() => onChange("week")}>周视图</button>
      <button type="button" className={value === "month" ? "active" : ""} onClick={() => onChange("month")}>月视图</button>
    </div>
  );
}

