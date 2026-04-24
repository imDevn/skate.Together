"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import type { Session } from "@/types/Session";
import SessionCard from "@/components/SessionCard";
import ProfileSetupModal from "@/components/ProfileSetupModal";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import LogoutButton from "@/components/LogoutButton";

type HomePageClientProps = {
  user: User | null;
  profile: {
    nickname: string | null;
    ea_id: string | null;
  } | null;
};

const SESSION_LIFETIME_MS = 10 * 60 * 1000;

const supabase = createClient();

export default function HomePageClient({ user, profile }: HomePageClientProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [refreshingSessions, setRefreshingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [playersOnline, setPlayersOnline] = useState(0);
  const [sessionModal, setSessionModal] = useState<Session | null>(null);

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

  const loadSessions = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) {
        setRefreshingSessions(true);
      }
  
      setSessionsError(null);
  
      const now = new Date().toISOString();
  
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .neq("status", "ended")
        .or(`expires_at.gt.${now},status.eq.playing`)
        .order("created_at", { ascending: false });
  
      if (error) {
        setSessionsError(error.message);
        if (showSpinner) {
          setRefreshingSessions(false);
        }
        setLoadingSessions(false);
        return;
      }
  
      setSessions(data ?? []);
      if (showSpinner) {
        setRefreshingSessions(false);
      }
      setLoadingSessions(false);
    }, []
  );

  // Load sessions on first mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadSessions();
  }, [loadSessions]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      loadSessions(false);
    }, 60_000);
  
    return () => clearInterval(interval);
  }, [loadSessions]);
	
	const handleGoLive = async () => {
    if (!user) {
      return;
    }
  
    if (!profile?.nickname || !profile?.ea_id) {
      alert("Please finish setting up your profile before posting a session.");
      return;
    }
  
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS).toISOString();
  
    const style =
      selectedTags.includes("arcade") ? "arcade" : "realistic";
  
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        created_by_user_id: user.id,
        created_by_nickname: profile.nickname,
        created_by_ea_id: profile.ea_id,
        note: note.trim() || null,
        style,
        status: "waiting",
        participants_count: 1,
        expires_at: expiresAt,
      })
      .select()
      .single();
  
    if (error) {
      console.error("Failed to create session:", error);
      alert("Could not create session. Check the console for details.");
      return;
    }
    
    setActiveSessionId(data.id);
    setNote("");
    setSelectedTags(["realistic"]);
  
    await loadSessions();
  };
	
	const handleJoinSession = async (id: string) => {
    if (!user || !profile?.nickname || !profile?.ea_id) return;
    if (activeSessionId !== null) return;

    const { data, error } = await supabase
      .from("sessions")
      .update({
        status: "playing",
        joined_by_user_id: user.id,
        joined_by_nickname: profile.nickname,
        joined_by_ea_id: profile.ea_id,
        participants_count: 2,
      })
      .eq("id", id)
      .eq("status", "waiting")
      .select()
      .single();

    if (error) {
      console.error("Failed to join session:", error);
      alert("Could not join session.");
      return;
    }

    setActiveSessionId(id);
    setSessionModal(data);
    await loadSessions();
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("creator-session-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `created_by_user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as Session;
  
          if (
            updatedSession.status === "playing" &&
            updatedSession.joined_by_user_id
          ) {
            setActiveSessionId(updatedSession.id);
            setSessionModal(updatedSession);
            void loadSessions(false);
          }
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadSessions]);
	
	const handleLeaveSession = () => {
    setSessions((current) =>
      current.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              status: "waiting",
              participants: session.participants_count,
            }
          : session
      )
    );

    setActiveSessionId(null);
  };
  
  const handleEndSession = async () => {
    if (!activeSessionId) return;
    
    const { error } = await supabase
      .from("sessions")
      .update({ status: "ended" })
      .eq("id", activeSessionId);

    if (error) {
      console.error("Failed to end session:", error);
      alert("Could not end session.");
      return;
    }

    setActiveSessionId(null);
    await loadSessions();
  };
	
	const getTimeSince = (createdAt: string) => {
    const seconds = Math.floor(
      // eslint-disable-next-line react-hooks/purity
      (Date.now() - new Date(createdAt).getTime()) / 1000
    );
  
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
    return `${Math.floor(seconds / 3600)} hr`;
  };
	
  const activeSession = activeSessionId !== null
      ? sessions.find((session) => session.id === activeSessionId) ?? null
      : null;
      
  const isHost = activeSession !== null && activeSession.created_by_user_id === (user?.id ?? "999");

  const refreshOnlineCount = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_online_player_count");
  
    if (!error && typeof data === "number") {
      setPlayersOnline(data);
    }
  }, []);

  useEffect(() => {
    const updatePresence = async () => {
      if (user) {
        await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", user.id);
      }
  
      await refreshOnlineCount();
    };
  
    void updatePresence();
  
    const interval = setInterval(() => {
      void updatePresence();
    }, 60_000);
  
    return () => clearInterval(interval);
  }, [user, refreshOnlineCount]);

  return (
		<div>
			<div className="wrap">
        <div id="modal-container">
          {user && (!profile?.nickname || !profile?.ea_id) && (
            <ProfileSetupModal
              userId={user.id}
              initialNickname={profile?.nickname ?? ""}
              initialEaId={profile?.ea_id ?? ""}
            />
          )}

          {sessionModal && (
            <div className="modal-backdrop">
              <div className="card section modal-card">
                <h2>Session Ready</h2>
                <p className="muted">
                  Add each other in-game using EA ID.
                </p>
                <div className="banner">
                  <strong>Host</strong>
                  <div>{sessionModal.created_by_nickname}</div>
                  <div>EA ID: {sessionModal.created_by_ea_id}</div>
                </div>
                {sessionModal.joined_by_nickname && (
                  <div className="banner">
                    <strong>Joined Player</strong>
                    <div>{sessionModal.joined_by_nickname}</div>
                    <div>EA ID: {sessionModal.joined_by_ea_id}</div>
                  </div>
                )}
                <button className="btn btn-primary" onClick={() => setSessionModal(null)}>
                  Got it
                </button>
              </div>
            </div>
          )}
        </div>

				<header className="topbar">
				  <div className="brand">
            <div className="brand-badge">S</div>
            <div>
              <div>skate.Together</div>
              <div className="tiny">a place to play party modes with eachother</div>
            </div>
				  </div>
				  <nav className="nav">
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
                <div className="value">{playersOnline}</div>
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
                      {activeSession.created_by_nickname.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="name">{activeSession.created_by_nickname}</div>
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
                      <div className="num">{activeSession.participants_count}</div>
                      <div className="tiny">Participants</div>
                    </div>
                    <div className="mini">
                      <div className="num">{getTimeSince(activeSession.created_at)}</div>
                      <div className="tiny">Live For</div>
                    </div>
                  </div>

                  {activeSession.note && (
                    <div className="muted">{activeSession.note}</div>
                  )}

                  <div className="banner">
                    <strong>Participants</strong>

                    <div className="tiny">
                      Host: {activeSession.created_by_nickname} — EA ID: {activeSession.created_by_ea_id}
                    </div>

                    {activeSession.joined_by_nickname && activeSession.joined_by_ea_id ? (
                      <div className="tiny">
                        Joined: {activeSession.joined_by_nickname} — EA ID: {activeSession.joined_by_ea_id}
                      </div>
                    ) : (
                      <div className="tiny">
                        Waiting for another player to join.
                      </div>
                    )}
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
                <button className="btn" onClick={() => loadSessions()}>
                  {refreshingSessions ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {sessionsError && (
                <div className="banner">
                  Could not load sessions: {sessionsError}
                </div>
              )}

              {loadingSessions ? (
                <div className="muted">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="muted">No active sessions right now.</div>
              ) : (
                <div className="session-list">
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoinSession}
                      isUserInSession={activeSessionId !== null}
                      time={getTimeSince(session.created_at)}
                      disabled={!user}
                    />
                  ))}
                </div>
              )}
            </section>
				  </main>

				  <aside>
            <section id="start-session" className="card section">
              <div className="section-head">
              <div>
                <h2>Start a Session</h2>
                <div className="muted">Don&apos;t see anything you like? Make your own posting to let skaters with similar tastes find you!</div>
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
