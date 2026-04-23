import Session from "@/types/Session";

type SessionCardProps = {
	session: Session;
	onJoin: (id: number) => void;
	onLeave?: () => void;
	isUserInSession: boolean;
	time: string;
};

export default function SessionCard({ session, onJoin, onLeave, isUserInSession, time }: SessionCardProps) {
  return (
    <article className="session">
      <div>
        <div className="session-top">
          <div className="avatar">
            {session.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="name">{session.name}</div>
            <div className="tiny">EA ID: {session.eaId}</div>
          </div>
        </div>

        <div className="muted">{session.note}</div>

        <div className="tags">
          {session.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

		<div className="session-actions">
      <div className="time-live">Live for {time}</div>

      {session.status === "waiting" ? (
        <button
          className="btn btn-success"
          onClick={() => onJoin(session.id)}
          disabled={isUserInSession}
        >
          {isUserInSession ? "Already in session" : "Join Session"}
        </button>
      ) : (
        <button className="btn" disabled>
          In Progress
        </button>
      )}
    </div>
    </article>
  );
}