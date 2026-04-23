export type Session = {
	id: number;
  createdByUserId: number;
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