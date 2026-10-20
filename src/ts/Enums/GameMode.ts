export const GameMode = {
	/** The six-chapter descent after Mara's signal. */
	STORY: 'story',
	/** No air limit, no goals. */
	FREE: 'free'
} as const;

export type GameMode = (typeof GameMode)[keyof typeof GameMode];
