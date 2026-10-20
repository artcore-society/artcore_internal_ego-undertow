import type AudioEngine from './AudioEngine.ts';
import type { SoundName } from '../Config/assets.ts';

/**
 * Out of the water: the splash of breaking the surface, then the open sea all around. These are
 * recordings and play dry, straight to the master: above water nothing is muffled any more.
 */
export default class SurfaceSounds {
	private static readonly BREACH_GAIN = 0.9;
	private static readonly SEA_GAIN = 0.55;

	private readonly _engine: AudioEngine;
	private readonly _encoded = new Map<SoundName, ArrayBuffer>();
	private readonly _decoded = new Map<SoundName, AudioBuffer>();
	private _sea: { source: AudioBufferSourceNode; gain: GainNode } | null = null;

	constructor(engine: AudioEngine) {
		this._engine = engine;
	}

	/** Encoded recordings, kept until the audio context exists to decode them. */
	public register(name: SoundName, encoded: ArrayBuffer): void {
		this._encoded.set(name, encoded);
	}

	/** Decodes everything registered. Call once the context is unlocked. */
	public async decode(): Promise<void> {
		const context = this._engine.context;

		if (!context) {
			return;
		}

		await Promise.all(
			[...this._encoded].map(async ([name, encoded]) => {
				// decodeAudioData detaches its input; keep the original intact. A sound that can't be
				// decoded is left out: the ending simply plays without it
				try {
					this._decoded.set(name, await context.decodeAudioData(encoded.slice(0)));
				} catch {
					console.warn(`Sound ${name} could not be decoded`);
				}
			})
		);
		this._encoded.clear();
	}

	/** Breaking through the surface (or slipping back under): the splash, and the sea fading in or out. */
	public surface(isAbove: boolean): void {
		const context = this._engine.context;
		const master = this._engine.master;
		const breach = this._decoded.get('breach');

		if (!context || !master) {
			return;
		}

		if (isAbove && breach) {
			const source = context.createBufferSource();
			const gain = context.createGain();
			source.buffer = breach;
			gain.gain.value = SurfaceSounds.BREACH_GAIN;
			source.connect(gain).connect(master);
			source.start();
		}

		this.sea(context, master, isAbove);
	}

	public stop(): void {
		const context = this._engine.context;

		if (context && this._sea) {
			this.fadeOut(context, this._sea, 0.3);
			this._sea = null;
		}
	}

	private sea(context: AudioContext, master: AudioNode, isOn: boolean): void {
		const recording = this._decoded.get('open-sea');

		if (!isOn) {
			this.stop();

			return;
		}

		if (this._sea || !recording) {
			return;
		}

		const source = context.createBufferSource();
		const gain = context.createGain();
		source.buffer = recording;
		source.loop = true;
		gain.gain.setValueAtTime(0, context.currentTime);
		// Swells in under the splash
		gain.gain.linearRampToValueAtTime(SurfaceSounds.SEA_GAIN, context.currentTime + 2.5);
		source.connect(gain).connect(master);
		source.start();
		this._sea = { source, gain };
	}

	private fadeOut(
		context: AudioContext,
		sound: { source: AudioBufferSourceNode; gain: GainNode },
		seconds: number
	): void {
		sound.gain.gain.cancelScheduledValues(context.currentTime);
		sound.gain.gain.setTargetAtTime(0, context.currentTime, seconds / 3);
		sound.source.stop(context.currentTime + seconds * 2);
	}
}
