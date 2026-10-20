export const GamePhase = {
	INTRO: 'intro',
	PLAYING: 'playing',
	FINISHED: 'finished'
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];
