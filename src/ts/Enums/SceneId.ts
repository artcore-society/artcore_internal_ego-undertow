/** The six places of the descent, shallow to deep. */
export const SceneId = {
	REEF: 'reef',
	KELP: 'kelp',
	WRECK: 'wreck',
	PASSAGE: 'passage',
	TEMPLE: 'temple',
	ATLANTIS: 'atlantis'
} as const;

export type SceneId = (typeof SceneId)[keyof typeof SceneId];
