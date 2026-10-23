import AudioEngine from './AudioEngine.ts';
import UnderwaterAmbience from './UnderwaterAmbience.ts';
import DeepDrone from './DeepDrone.ts';
import ReefCrackle from './ReefCrackle.ts';
import KelpRustle from './KelpRustle.ts';
import SoundEffects from './SoundEffects.ts';
import VoicePlayer from './VoicePlayer.ts';
import SurfaceSounds from './SurfaceSounds.ts';
import { damp } from '../Helpers/math.ts';
import type { Vector3 } from 'three';
import type IDisposable from '../Contracts/IDisposable.ts';
import type { SceneId } from '../Enums/SceneId.ts';

export type SceneWeights = Readonly<Record<SceneId, number>>;

/** Where the sounds that belong to a place come from, so they can be heard from that direction. */
export interface ISoundSources {
	readonly whale: () => Readonly<Vector3>;
	readonly wreck: () => Readonly<Vector3>;
	readonly temple: () => Readonly<Vector3>;
	readonly atlantis: () => Readonly<Vector3>;
}

interface IOccasional {
	/** Where it happens; null for anywhere. */
	readonly scene: SceneId | null;
	readonly every: readonly [min: number, max: number];
	readonly play: () => void;
}

/**
 * The soundscape. A deep, still pressure underneath everything; layers that fade with where you are
 * (shrimp crackling on the reef, rustling kelp, the drone of the deep); occasional sounds, some
 * anywhere (bubbles, a far-off whale), some tied to places (the wreck creaks, the abyss groans).
 * Ambience ducks whenever someone speaks. Sounds that belong to a place are heard from where they are.
 */
export default class SoundDirector implements IDisposable {
	public readonly effects: SoundEffects;
	public readonly voices: VoicePlayer;
	public readonly surfaceSounds: SurfaceSounds;

	private readonly _engine = new AudioEngine();
	private readonly _ambience = new UnderwaterAmbience(this._engine);
	private readonly _drone = new DeepDrone(this._engine);
	private readonly _reef = new ReefCrackle(this._engine);
	private readonly _kelp = new KelpRustle(this._engine);
	private readonly _occasional: readonly IOccasional[];
	private readonly _timers = new Map<IOccasional, number>();
	private _isAbove = false;
	private _sources: ISoundSources | null = null;
	/** 1 = the soundscape as normal, 0 = hushed. */
	private _presence = 1;

	/** Hushes the whole soundscape (not voices or breathing): a held breath at the edge of the drop. */
	public isHushed = false;

	constructor() {
		this.effects = new SoundEffects(this._engine);
		this.voices = new VoicePlayer(this._engine);
		this.surfaceSounds = new SurfaceSounds(this._engine);
		this._occasional = [
			{ scene: null, every: [5, 11], play: () => this.effects.trickle() },
			{ scene: null, every: [20, 38], play: () => this.effects.distantWhale() },
			{ scene: 'wreck', every: [4, 9], play: () => this.effects.creak(this._sources?.wreck()) },
			{
				scene: 'passage',
				every: [14, 26],
				play: () => this.effects.whaleSong(undefined, undefined, this._sources?.whale())
			},
			{ scene: 'temple', every: [12, 22], play: () => this.effects.groan(this._sources?.temple()) },
			{ scene: 'atlantis', every: [16, 28], play: () => this.effects.groan(this._sources?.atlantis()) }
		];
		this._occasional.forEach((sound) => this._timers.set(sound, sound.every[0]));
	}

	public get isMuted(): boolean {
		return this._engine.isMuted;
	}

	/** Must be called from a user gesture. */
	public async start(): Promise<void> {
		await this._engine.unlock();
		[this._ambience, this._drone, this._reef, this._kelp].forEach((layer) => layer.start());
		await Promise.all([this.voices.decode(), this.surfaceSounds.decode()]);
	}

	public place(sources: ISoundSources): void {
		this._sources = sources;
	}

	/** Where the listener is and looks: placed sounds turn as the view turns. */
	public listen(position: Readonly<Vector3>, forward: Readonly<Vector3>): void {
		this._engine.listen(position, forward);
	}

	public toggleMute(): boolean {
		return this._engine.toggleMute();
	}

	/** Out of the water the underwater world goes silent and the open sea takes over (and back). */
	public surface(isAbove: boolean): void {
		this._isAbove = isAbove;
		this.surfaceSounds.surface(isAbove);
	}

	/** Back under for another dive. */
	public reset(): void {
		this._isAbove = false;
		this.surfaceSounds.stop();
	}

	/**
	 * @param depth metres below the surface
	 * @param scenes 0..1 how close the listener is to each place
	 */
	public update(depth: number, scenes: SceneWeights, delta: number): void {
		// Ambience ducks under the voice so every word is clear
		// Above the surface the underwater layers fall silent
		this._presence = damp(this._presence, this.isHushed ? 0 : 1, this.isHushed ? 0.9 : 0.5, delta);
		const duck = (this._isAbove ? 0 : this.voices.isSpeaking ? 0.45 : 1) * this._presence;

		this._ambience.setLevel(duck);
		this._drone.setLevel(Math.min(1, Math.max(0, (depth - 30) / 140)) * duck);
		this._reef.setLevel(scenes.reef * duck);
		this._kelp.setLevel(scenes.kelp * duck);

		for (const sound of this._occasional) {
			const remaining = (this._timers.get(sound) ?? 0) - delta * (sound.scene ? scenes[sound.scene] : 1);

			if (remaining <= 0 && !this.voices.isSpeaking && !this._isAbove && !this.isHushed) {
				sound.play();
				this._timers.set(sound, sound.every[0] + Math.random() * (sound.every[1] - sound.every[0]));
			} else {
				this._timers.set(sound, remaining);
			}
		}
	}

	public dispose(): void {
		this._engine.dispose();
	}
}
