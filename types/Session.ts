export type Session = {
	id: string;
	created_by_user_id: string;
	created_by_nickname: string;
	created_by_ea_id: string;
	note: string | null;
	style: "realistic" | "arcade";
	status: "waiting" | "playing" | "ended";
	participants_count: number;
	created_at: string;
	expires_at: string;
	joined_by_user_id: string | null;
	joined_by_nickname: string | null;
	joined_by_ea_id: string | null;
  };
