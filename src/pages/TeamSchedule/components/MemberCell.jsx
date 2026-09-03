export default function MemberCell({ member }) {
  return (
    <div className="member-cell">
      <span className={`member-avatar tone-${member.tone}`}>{member.initials}</span>
      <span className="member-info">
        <strong>{member.name}</strong>
        <small className={`tone-${member.tone}`}>{member.role}</small>
      </span>
    </div>
  );
}

