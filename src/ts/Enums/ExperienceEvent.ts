import type { GamePhase } from './GamePhase.ts';
import type { GameMode } from './GameMode.ts';
import type { ISpokenLine } from '../Story/Narrator.ts';
import type { IObjective } from '../Story/Steps/IStoryStep.ts';
import type { IChapterCard } from '../Story/IChapter.ts';

export interface ISignalBearing {
	/** Screen-space angle in radians, 0 = up, clockwise. */
	readonly angle: number;
	readonly distance: number;
	/** True while the target is in front of the camera and inside the frame. */
	readonly isVisible: boolean;
}

export interface ITelemetry {
	readonly depth: number;
	readonly oxygen: number;
	readonly isLowOxygen: boolean;
	readonly isSprinting: boolean;
	readonly isFlashlightOn: boolean;
	readonly signal: ISignalBearing | null;
	/** Name of the place the diver is in, e.g. "The Reef". */
	readonly location: string;
}

export interface IDiveResult {
	readonly mode: GameMode;
	/** Seconds the descent took. */
	readonly duration: number;
	readonly shards: number;
	readonly blackouts: number;
	readonly maxDepth: number;
}

/** Typed map of every event the experience publishes. */
export interface ExperienceEventMap {
	ready: undefined;
	phaseChanged: GamePhase;
	modeChanged: GameMode;
	shardsChanged: number;
	shardCollected: number;
	telemetry: ITelemetry;
	muteChanged: boolean;
	finished: IDiveResult;
	dialogue: ISpokenLine | null;
	objective: IObjective | null;
	chapter: IChapterCard;
	blackout: string;
}
