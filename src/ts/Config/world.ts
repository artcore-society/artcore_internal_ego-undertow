import { SceneId } from '../Enums/SceneId.ts';

export const SURFACE_Y = 0;

/** The seabed descends along -Z. Control points of the floor profile: [z, floor height]. */
export const FLOOR_PROFILE: readonly (readonly [number, number])[] = [
	[140, -9],
	[40, -13],
	[-70, -16],
	[-120, -25],
	[-210, -30],
	[-260, -41],
	[-370, -50],
	[-430, -56],
	[-470, -74],
	[-530, -132],
	[-590, -162],
	[-650, -169],
	[-760, -177],
	[-860, -188],
	[-1020, -192]
];

export const WORLD_BOUNDS = {
	minX: -240,
	maxX: 240,
	minZ: -1000,
	maxZ: 120
} as const;

/** The canyon winds a little so the way down never reads as a straight corridor. */
export function canyonCentre(z: number): number {
	return Math.sin(z * 0.005) * 34;
}

/** Floor of the canyon at a point along it (without noise). */
export function floorAt(z: number): number {
	const first = FLOOR_PROFILE[0];
	const last = FLOOR_PROFILE[FLOOR_PROFILE.length - 1];

	if (!first || !last) {
		return 0;
	}

	if (z >= first[0]) {
		return first[1];
	}

	for (let i = 1; i < FLOOR_PROFILE.length; i++) {
		const upper = FLOOR_PROFILE[i - 1];
		const lower = FLOOR_PROFILE[i];

		if (upper && lower && z >= lower[0]) {
			const t = (upper[0] - z) / (upper[0] - lower[0]);
			const eased = t * t * (3 - 2 * t);

			return upper[1] + (lower[1] - upper[1]) * eased;
		}
	}

	return last[1];
}

export interface ISceneConfig {
	readonly id: SceneId;
	readonly label: string;
	readonly z: number;
	/** Half-width of the canyon here. */
	readonly width: number;
	/** Radius the scene's props live in (visibility culling). */
	readonly radius: number;
}

export const SCENES: Readonly<Record<SceneId, ISceneConfig>> = {
	[SceneId.REEF]: { id: SceneId.REEF, label: 'The Reef', z: 10, width: 95, radius: 110 },
	[SceneId.KELP]: { id: SceneId.KELP, label: 'Kelp Cathedral', z: -165, width: 85, radius: 110 },
	[SceneId.WRECK]: { id: SceneId.WRECK, label: 'Wreck of the Halcyon', z: -320, width: 75, radius: 90 },
	[SceneId.PASSAGE]: { id: SceneId.PASSAGE, label: 'The Whale Road', z: -500, width: 70, radius: 140 },
	[SceneId.TEMPLE]: { id: SceneId.TEMPLE, label: 'The Drowned Temple', z: -680, width: 95, radius: 110 },
	[SceneId.ATLANTIS]: { id: SceneId.ATLANTIS, label: 'Atlantis', z: -870, width: 160, radius: 170 }
};

export const SCENE_ORDER: readonly SceneId[] = [
	SceneId.REEF,
	SceneId.KELP,
	SceneId.WRECK,
	SceneId.PASSAGE,
	SceneId.TEMPLE,
	SceneId.ATLANTIS
];

/** Canyon half-width at a point along it, eased between scenes. */
export function canyonWidthAt(z: number): number {
	const scenes = SCENE_ORDER.map((id) => SCENES[id]);
	const first = scenes[0];
	const last = scenes[scenes.length - 1];

	if (!first || !last) {
		return 80;
	}

	if (z >= first.z) {
		return first.width;
	}

	for (let i = 1; i < scenes.length; i++) {
		const upper = scenes[i - 1];
		const lower = scenes[i];

		if (upper && lower && z >= lower.z) {
			const t = (upper.z - z) / (upper.z - lower.z);

			return upper.width + (lower.width - upper.width) * t * t * (3 - 2 * t);
		}
	}

	return last.width;
}

export const DIVER_START = { x: canyonCentre(60), y: -5, z: 60 } as const;
