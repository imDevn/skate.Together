import type { Session } from "@/types/Session";
import { createClient } from "@/utils/supabase/client";

type SessionCardProps = {
  session: Session;
  onJoin: (id: string) => void;
  isUserInSession: boolean;
  time: string;
  disabled?: boolean;
};

export default function SessionCard({ session, onJoin, isUserInSession, time, disabled }: SessionCardProps) {
  return (
    <article className="session">
      <div>
        <div className="session-top">
          <div className="avatar">
            {session.created_by_nickname.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="name">{session.created_by_nickname}</div>
            <div className="tiny">
              Style: {session.style} • Players: {session.participants_count}
            </div>
          </div>
        </div>

        <div className="muted">{session.note || "No note provided."}</div>
      </div>

      <div className="session-actions">
        <div className="time-live">Live for {time}</div>

        {session.status === "waiting" ? (
          <button
            className="btn btn-success"
            onClick={() => {
              if (disabled) {
                const supabase = createClient();
                supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
                return;
              }

              onJoin(session.id);
            }}
          >
            {disabled
              ? "Sign in to join"
              : isUserInSession
              ? "Already in session"
              : "Join Session"}
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
