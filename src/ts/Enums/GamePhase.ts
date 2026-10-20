export const GamePhase = {
	LOADING: 'loading',
	INTRO: 'intro',
	JOURNEY: 'journey',
	/** The end, just under the surface: the credits. */
	FINISHED: 'finished',
	/** Up through the surface into the sunset: the closing card. */
	SURFACED: 'surfaced'
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];
