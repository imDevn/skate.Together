"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Session } from "@/types/Session";
import SessionCard from "@/components/SessionCard";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import LogoutButton from "@/components/LogoutButton";

type HomePageClientProps = {
  user: User | null;
  profile: {
    nickname: string | null;
    ea_id: string | null;
  } | null;
};

const NOW = 1700000000000;
const SESSION_LIFETIME = 10 * 60 * 1000;

const initialSessions: Session[] = [
  {
    id: 1,
    createdByUserId: 1,
    participants: [1],
    name: "Devan",
    eaId: "devan_ferreira",
    note: "realistic rails",
    tags: ["realistic"],
    style: "realistic",
    time: "2 min",
    status: "waiting",
    createdAt: NOW - 2 * 60 * 1000,
    expiresAt: NOW - 2 * 60 * 1000 + SESSION_LIFETIME,
  },
  {
    id: 2,
    createdByUserId: 2,
    participants: [2],
    name: "Rookz",
    eaId: "rookz_flipz",
    note: "park or street",
    tags: ["arcade"],
    style: "arcade",
    time: "5 min",
    status: "waiting",
    createdAt: NOW - 4 * 60 * 1000,
    expiresAt: NOW - 4 * 60 * 1000 + SESSION_LIFETIME,
  },
];

export default function HomePageClient({ user, profile }: HomePageClientProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [hasMounted, setHasMounted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const [note, setNote] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([
		"realistic",
	]);
	
	const availableTags = [
		"realistic",
		"arcade",
	];
	
	const toggleTag = (tag: string) => {
		setSelectedTags((current) =>
			current.includes(tag)
				? current.filter((t) => t !== tag)
				: [...current, tag]
		);
	};
	
	const handleGoLive = () => {
    const now = Date.now();

    const newSession: Session = {
      id: now,
      createdByUserId: CURRENT_USER_ID,
      participants: [CURRENT_USER_ID],
      name: "You",
      eaId: "your_ea_id_here",
      note: note.trim() || "Looking for a SKATE session",
      tags: selectedTags,
      style: selectedTags.includes("arcade") ? "arcade" : "realistic",
      time: "just now",
      status: "waiting",
      createdAt: now,
      expiresAt: now + SESSION_LIFETIME,
    };

    setSessions((current) => [newSession, ...current]);
    setActiveSessionId(newSession.id);
    setNote("");
    setSelectedTags(["realistic"]);
  };
	
	const handleJoinSession = (id: number) => {
    if (activeSessionId !== null) {
      return;
    }

    setSessions((current) =>
      current.map((session) =>
        session.id === id
          ? {
              ...session,
              status: "playing",
              participants: [...session.participants, CURRENT_USER_ID],
            }
          : session
      )
    );

    setActiveSessionId(id);
  };
	
	const handleLeaveSession = () => {
    setSessions((current) =>
      current.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              status: "waiting",
              participants: session.participants.filter(
                (id) => id !== CURRENT_USER_ID
              ),
            }
          : session
      )
    );

    setActiveSessionId(null);
  };
  
  const handleEndSession = () => {
    setSessions((current) =>
      current.filter((session) => session.id !== activeSessionId)
    );

    setActiveSessionId(null);
  };
	
	const getTimeSince = (createdAt: number) => {
	  const seconds = Math.floor((Date.now() - createdAt) / 1000);

	  if (seconds < 60) return "just now";
	  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
	  return `${Math.floor(seconds / 3600)} hr`;
	};
	
  // Expiration system
	useEffect(() => {
    const interval = setInterval(() => {
      setSessions((current) =>
        current.filter((session) => Date.now() < session.expiresAt)
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  
  // Load localStorage after mount
  useEffect(() => {
    setHasMounted(true);

    const savedSessions = localStorage.getItem("sessions");

    if (!savedSessions) return;

    try {
      setSessions(JSON.parse(savedSessions));
    } catch {
      // ignore bad saved data and keep defaults
    }
  }, []);
  
  // Persistence system
  useEffect(() => {
    if (!hasMounted)
      return;
    localStorage.setItem("sessions", JSON.stringify(sessions));
  }, [sessions, hasMounted]);
	
  const activeSession =
    activeSessionId !== null
      ? sessions.find((session) => session.id === activeSessionId) ?? null
      : null;
      
  const isHost =
    activeSession !== null && activeSession.createdByUserId === CURRENT_USER_ID;

  return (
		<div>
			<div className="wrap">
				<header className="topbar">
				  <div className="brand">
            <div className="brand-badge">S</div>
            <div>
              <div>skate.Together</div>
              <div className="tiny">a place to play party modes with eachother</div>
            </div>
				  </div>
				  <nav className="nav">
            <a className="pill" href="#active-sessions">Active Sessions</a>
            <a className="pill" href="#start-session">Start Session</a>
            {user ? (
              <>
                <a className="pill" href="#profile">
                  Profile
                </a>
                <LogoutButton />
              </>
            ) : (
              <GoogleSignInButton />
            )}
				  </nav>
				</header>
        
				<section className="hero">
          
          <div className="card hero-main">
            <div>
              <div className="eyebrow">Find people to play SKATE with now</div>
              <h1>Tired of waiting for SKATE?<br/>So is everyone else.</h1>
              <ol className="sub">
                A simple community site for setting up SKATE matches fast.
                <li>1. See who’s active</li>
                <li>2. Join a session</li>
                <li>3. Add the person in-game using their EA ID</li>
              </ol>
            </div>
            <div className="hero-actions">
              <a href="#start-session" className="btn btn-primary">Play SKATE</a>
              <a href="#active-sessions" className="btn">See Active Sessions</a>
            </div>
            <div className="banner">
              * This site is in very early development! *<br/>
              It works best when people are actively using it, so first-launch activity may be uneven. Please keep that in mind and send feedback if something feels confusing or broken.
            </div>
				  </div>

				  <aside className="card hero-side">
            <div className="label-row">
              <strong>Statistics</strong>
            </div>
            <div className="stat-grid">
              <div className="stat">
                <div className="label">Active Sessions</div>
                <div className="value">{sessions.length}</div>
              </div>
              <div className="stat">
                <div className="label">Players Online</div>
                <div className="value">0</div>
              </div>
              <div className="stat">
                <div className="label">Sessions Played Today</div>
                <div className="value">0</div>
              </div>
              <div className="stat">
                <div className="label">Total Sessions Played</div>
                <div className="value">0</div>
              </div>
            </div>
				  </aside>
				</section>

				<section className="layout">
				  <main>
            {activeSession && (
              <section className="card section">
                <div className="section-head">
                  <div>
                    <h2>My Active Session</h2>
                    <div className="muted">
                      Keep track of your current session here.
                    </div>
                  </div>
                </div>

                <div className="profile">
                  <div className="profile-top">
                    <div className="avatar large">
                      {activeSession.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="name">{activeSession.name}</div>
                      <div className="tiny">
                        Role: {isHost ? "Host" : "Participant"}
                      </div>
                      <div className="tiny">
                        Status: {activeSession.status === "waiting" ? "Waiting for someone to join" : "Playing"}
                      </div>
                      <div className="tiny">Style: {activeSession.style}</div>
                    </div>
                  </div>

                  <div className="split-stats">
                    <div className="mini">
                      <div className="num">{activeSession.participants.length}</div>
                      <div className="tiny">Participants</div>
                    </div>
                    <div className="mini">
                      <div className="num">{hasMounted ? getTimeSince(activeSession.createdAt) : activeSession.time}</div>
                      <div className="tiny">Live For</div>
                    </div>
                  </div>

                  <div className="muted">{activeSession.note}</div>

                  <div className="banner">
                    Multiple players will be supported soon. For now, if you want to play with more people,
                    you can end this session and create another one.
                  </div>

                  <div className="hero-actions">
                    <button
                      className="btn"
                      onClick={isHost ? handleEndSession : handleLeaveSession}
                    >
                      {isHost ? "End Session" : "Leave Session"}
                    </button>
                  </div>
                </div>
              </section>
            )}
          
            <section id="active-sessions" className="card section">
              <div className="section-head">
                <div>
                  <h2>Active SKATE Sessions</h2>
                  <div className="muted">Session posts expire after 10 minutes.</div>
                </div>
                <button className="btn">Refresh</button>
              </div>

              <div className="session-list">
                {sessions
                  .filter((session) => session.status === "waiting")
                  .map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoinSession}
                      onLeave={handleLeaveSession}
                      isUserInSession={activeSessionId !== null}
                      time={hasMounted ? getTimeSince(session.createdAt) : session.time}
                      disabled={!user}
                    />
                  ))
                }
              </div>
            </section>
				  </main>

				  <aside>
            <section id="start-session" className="card section">
              <div className="section-head">
              <div>
                <h2>Start a Session</h2>
                <div className="muted">Don't see anything you like? Make your own posting to let skaters with similar tastes find you!</div>
              </div>
              </div>

              <form className="quick-form">
                <div>
                  <div className="label-row">
                    <label htmlFor="mode"><strong>Mode</strong></label>
                    <span className="tiny">* Support for more modes is being worked on</span>
                  </div>
                  <select id="mode" className="select" defaultValue="skate">
                    <option value="skate">SKATE</option>
                    <option value="throwdown" disabled>Throwdown</option>
                    <option value="race" disabled>Death Race</option>
                  </select>
                </div>

                <div>
                  <div className="label-row">
                    <label htmlFor="note"><strong>Notes</strong></label>
                    <span className="tiny">* Optional - There could be kids here, please no toilet words</span>
                  </div>
                  <textarea
                    id="note"
                    rows={4}
                    placeholder="Example: Realistic rails, chill session, no mega ramp stuff."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div>
                  <div className="label-row">
                    <strong>Style</strong>
                    <span className="tiny">* Support for more tags is being worked on</span>
                  </div>
                  <div className="check-row">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`check ${selectedTags.includes(tag) ? "active" : ""}`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => {
                    if (!user) {
                      const supabase = createClient();
                      supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback`,
                        },
                      });
                      return;
                    }

                    handleGoLive();
                  }}
                >
                    Post Session
                </button>
                
              </form>
              
              {!user && (
                <div className="banner">
                  You must sign in and set an EA ID before you can post or join sessions.
                </div>
              )}
            </section>

            {user && (
              <section id="profile" className="card section">
                <div className="section-head">
                  <div>
                    <h2>My Profile</h2>
                  </div>
                </div>

                <div className="profile">
                  <div className="profile-top">
                    <div className="avatar large">
                      {(profile?.nickname?.[0] ?? "U").toUpperCase()}
                    </div>
                    <div>
                      <div className="name">{profile?.nickname ?? "No nickname set"}</div>
                      <div className="tiny">EA ID: {profile?.ea_id ?? "No EA ID set"}</div>
                    </div>
                  </div>

                  <div className="split-stats">
                    <div className="mini">
                      <div className="num">0</div>
                      <div className="tiny">Sessions Made</div>
                    </div>
                    <div className="mini">
                      <div className="num">0</div>
                      <div className="tiny">Sessions Played</div>
                    </div>
                  </div>
                  
                  <a href="/profile/setup" className="btn">
                    Customize
                  </a>
                </div>
              </section>
            )}  
				  </aside>
				</section>
			</div>
		</div>
	);
}