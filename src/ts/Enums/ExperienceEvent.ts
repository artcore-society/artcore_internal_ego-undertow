import type { GamePhase } from './GamePhase.ts';
import type { ILoadProgress } from '../Assets/AssetLibrary.ts';
import type { Speaker, StopId } from '../Journey/IJourney.ts';

export interface IChapterView {
	readonly numeral: string;
	readonly title: string;
	readonly subtitle: string;
	readonly location: string;
}

export interface ICaptionView {
	readonly id: string;
	readonly speaker: Speaker | null;
	readonly text: string;
}

export interface IStopView {
	readonly id: StopId;
	readonly label: string;
}

export interface IHotspotView {
	/** 0..1 across the screen. */
	readonly x: number;
	/** 0..1 down the screen. */
	readonly y: number;
	readonly isVisible: boolean;
}

export interface ISignalView {
	/** Bearing relative to where the diver looks, radians: 0 ahead, positive to the right. */
	readonly bearing: number;
	readonly distance: number;
}

export interface ITelemetry {
	/** 0..1 along the journey. */
	readonly progress: number;
	readonly depth: number;
	readonly temperature: number;
	readonly hotspot: IHotspotView | null;
	/** 0..1 loudness of the voice speaking now. */
	readonly voiceLevel: number;
	/** Compass heading the diver faces, degrees, 0 = north (down the canyon). */
	readonly heading: number;
	/** Where Mara's signal comes from, or null once every stop is behind. */
	readonly signal: ISignalView | null;
	/** 0..1 strength of the boat radio: it fades the deeper you go. */
	readonly radio: number;
}

/** Typed map of every event the experience publishes. */
export interface ExperienceEventMap {
	loading: ILoadProgress;
	ready: undefined;
	phaseChanged: GamePhase;
	chapter: IChapterView | null;
	caption: ICaptionView | null;
	stop: IStopView | null;
	telemetry: ITelemetry;
	gathered: number;
	muteChanged: boolean;
	/** The diver asked for the controls card (H). */
	help: undefined;
}
