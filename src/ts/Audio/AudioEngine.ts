import type { Vector3 } from 'three';
import type IDisposable from '../Contracts/IDisposable.ts';

/** Owns the AudioContext and the master bus. Browsers only allow starting it from a user gesture. */
export default class AudioEngine implements IDisposable {
	private static readonly VOLUME = 0.65;

	private _context: AudioContext | null = null;
	private _master: GainNode | null = null;
	private _effects: GainNode | null = null;
	private _noise: AudioBuffer | null = null;
	private _muted = false;

	public get context(): AudioContext | null {
		return this._context;
	}

	public get master(): GainNode | null {
		return this._master;
	}

	/**
	 * Where sound effects go: muffled and given a dark, wide reverb, so they sound like they happen in
	 * the water around you rather than on top of it.
	 */
	public get effects(): GainNode | null {
		return this._effects;
	}

	public get isMuted(): boolean {
		return this._muted;
	}

	/**
	 * An input on the effects bus that sounds from `position`: panned towards it and a little quieter
	 * with distance. Cheap equal-power panning (no HRTF); one per sound, dropped when the sound ends.
	 */
	public at(position: Readonly<Vector3>): AudioNode | null {
		const context = this._context;
		const effects = this._effects;

		if (!context || !effects) {
			return null;
		}

		const panner = context.createPanner();
		panner.panningModel = 'equalpower';
		panner.distanceModel = 'inverse';
		panner.refDistance = 12;
		panner.rolloffFactor = 0.5;
		panner.positionX.value = position.x;
		panner.positionY.value = position.y;
		panner.positionZ.value = position.z;
		panner.connect(effects);

		return panner;
	}

	/** Where the listener is and looks (call every frame). */
	public listen(position: Readonly<Vector3>, forward: Readonly<Vector3>): void {
		const listener = this._context?.listener;

		if (!listener?.positionX) {
			return;
		}

		listener.positionX.value = position.x;
		listener.positionY.value = position.y;
		listener.positionZ.value = position.z;
		listener.forwardX.value = forward.x;
		listener.forwardY.value = forward.y;
		listener.forwardZ.value = forward.z;
	}

	/** Two seconds of white noise, shared by every noise-based sound. */
	public get noiseBuffer(): AudioBuffer | null {
		return this._noise;
	}

	public async unlock(): Promise<boolean> {
		if (!this._context) {
			const context = new AudioContext();
			const compressor = context.createDynamicsCompressor();
			const master = context.createGain();

			master.gain.value = this._muted ? 0 : AudioEngine.VOLUME;
			master.connect(compressor).connect(context.destination);

			this._context = context;
			this._master = master;
			this._noise = AudioEngine.createNoise(context);
			this._effects = AudioEngine.createEffectsBus(context, master);
		}

		if (this._context.state === 'suspended') {
			await this._context.resume();
		}

		return true;
	}

	public toggleMute(): boolean {
		this._muted = !this._muted;

		if (this._context && this._master) {
			this._master.gain.setTargetAtTime(this._muted ? 0 : AudioEngine.VOLUME, this._context.currentTime, 0.1);
		}

		return this._muted;
	}

	public dispose(): void {
		void this._context?.close();
		this._context = null;
		this._master = null;
	}

	private static createEffectsBus(context: AudioContext, master: AudioNode): GainNode {
		const input = context.createGain();
		const muffle = context.createBiquadFilter();
		const dry = context.createGain();
		const reverb = context.createConvolver();
		const wet = context.createGain();

		input.gain.value = 0.8;
		muffle.type = 'lowpass';
		muffle.frequency.value = 2200;
		muffle.Q.value = 0.3;
		dry.gain.value = 0.75;
		wet.gain.value = 0.4;
		reverb.buffer = AudioEngine.waterImpulse(context, 2.8);

		input.connect(muffle);
		muffle.connect(dry).connect(master);
		muffle.connect(reverb).connect(wet).connect(master);

		return input;
	}

	/** A dark, diffuse tail: high frequencies die fast in water. */
	private static waterImpulse(context: AudioContext, seconds: number): AudioBuffer {
		const length = Math.floor(context.sampleRate * seconds);
		const buffer = context.createBuffer(2, length, context.sampleRate);

		for (let channel = 0; channel < 2; channel++) {
			const data = buffer.getChannelData(channel);
			let smooth = 0;

			for (let i = 0; i < length; i++) {
				// Low-passed noise, decaying
				smooth += (Math.random() * 2 - 1 - smooth) * 0.08;
				data[i] = smooth * Math.pow(1 - i / length, 2.4) * 2.2;
			}
		}

		return buffer;
	}

	private static createNoise(context: AudioContext): AudioBuffer {
		const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < data.length; i++) {
			data[i] = Math.random() * 2 - 1;
		}

		return buffer;
	}
}
