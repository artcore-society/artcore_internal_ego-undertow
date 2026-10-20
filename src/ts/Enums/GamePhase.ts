export const GamePhase = {
	LOADING: 'loading',
	INTRO: 'intro',
	JOURNEY: 'journey',
	FINISHED: 'finished'
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];
