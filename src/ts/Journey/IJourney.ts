import type { Vector3 } from 'three';

/** Kai on the boat radio, Mara's voice on the signal, the diver, and the voice under everything. */
export type Speaker = 'Kai' | 'Mara' | 'You' | 'The Deep';

/** A camera keyframe on the rail. */
export interface IShot {
	readonly progress: number;
	readonly position: Vector3;
	readonly target: Vector3;
}

/** A line of the story, on screen while the journey is between `from` and `to`. */
export interface ICaption {
	readonly id: string;
	readonly from: number;
	readonly to: number;
	readonly speaker?: Speaker;
	readonly text: string;
}

export interface IChapter {
	readonly numeral: string;
	readonly title: string;
	readonly subtitle: string;
	readonly location: string;
	readonly from: number;
	readonly to: number;
}

export type StopId = 'marker' | 'recorder' | 'whale' | 'altar' | 'heart';

/**
 * A place the journey pauses: scrolling stops here until the hotspot is clicked.
 * Meanwhile the diver can drag to look around.
 */
export interface IStop {
	readonly id: StopId;
	readonly progress: number;
	/** What clicking the hotspot does, e.g. "Play Mara's last log". */
	readonly label: string;
	/** World position of the hotspot; a function for moving things (the whale). */
	readonly hotspot: () => Vector3;
	readonly onActivate: () => void;
}

export interface IJourney {
	readonly shots: readonly IShot[];
	readonly captions: readonly ICaption[];
	readonly chapters: readonly IChapter[];
	readonly stops: readonly IStop[];
}
