export type Session = {
	id: number;
  createdByUserId: string;
  participants: number[];
	name: string;
	eaId: string;
	note: string;
	tags: string[];
  style: "realistic" | "arcade";
	time: string;
	status: "waiting" | "playing" | "ended";
  createdAt: number;
  expiresAt: number;
};