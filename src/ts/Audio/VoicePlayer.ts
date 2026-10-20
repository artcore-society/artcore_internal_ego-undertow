import type AudioEngine from './AudioEngine.ts';
import type { Speaker } from '../Journey/IJourney.ts';

interface IVoiceChain {
	readonly input: AudioNode;
	readonly playbackRate: number;
}

/**
 * Plays the recorded narration. Each speaker has their own treatment: Kai through a boat radio,
 * Mara like an old recorder, The Deep slowed and drowned in reverb. One line at a time; a new line
 * fades the previous one out. An analyser exposes the loudness so the UI can pulse with the voice.
 */
export default class VoicePlayer {
	private static readonly FADE = 0.25;

	private readonly _engine: AudioEngine;
	private readonly _encoded = new Map<string, ArrayBuffer>();
	private readonly _decoded = new Map<string, AudioBuffer>();
	private readonly _chains = new Map<Speaker, IVoiceChain>();
	private _analyser: AnalyserNode | null = null;
	private _samples: Uint8Array<ArrayBuffer> | null = null;
	private _current: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
	private _endsAt = 0;

	constructor(engine: AudioEngine) {
		this._engine = engine;
	}

	/** True while a line is audible. */
	public get isSpeaking(): boolean {
		const context = this._engine.context;

		return context !== null && this._current !== null && context.currentTime < this._endsAt;
	}

	/** 0..1 loudness of the voice right now. */
	public get level(): number {
		if (!this._analyser || !this._samples || !this.isSpeaking) {
			return 0;
		}

		this._analyser.getByteTimeDomainData(this._samples);

		let sum = 0;

		for (const sample of this._samples) {
			const value = (sample - 128) / 128;
			sum += value * value;
		}

		return Math.min(1, Math.sqrt(sum / this._samples.length) * 4);
	}

	/** Encoded lines, kept until the audio context exists to decode them. */
	public register(id: string, encoded: ArrayBuffer): void {
		this._encoded.set(id, encoded);
	}

	public has(id: string): boolean {
		return this._encoded.has(id) || this._decoded.has(id);
	}

	/** Decodes everything registered. Call once the context is unlocked. */
	public async decode(): Promise<void> {
		const context = this._engine.context;

		if (!context) {
			return;
		}

		await Promise.all(
			[...this._encoded].map(async ([id, encoded]) => {
				// decodeAudioData detaches its input; keep the original intact
				this._decoded.set(id, await context.decodeAudioData(encoded.slice(0)));
			})
		);
		this._encoded.clear();
	}

	public play(id: string, speaker: Speaker): void {
		const context = this._engine.context;
		const buffer = this._decoded.get(id);

		this.stop();

		if (!context || !buffer) {
			return;
		}

		const chain = this.chain(context, speaker);
		const source = context.createBufferSource();
		const gain = context.createGain();

		source.buffer = buffer;
		source.playbackRate.value = chain.playbackRate;
		source.connect(gain).connect(chain.input);
		source.start();

		this._current = { source, gain };
		this._endsAt = context.currentTime + buffer.duration / chain.playbackRate;
	}

	public stop(): void {
		const context = this._engine.context;
		const current = this._current;

		if (!context || !current) {
			return;
		}

		current.gain.gain.setTargetAtTime(0, context.currentTime, VoicePlayer.FADE / 3);
		current.source.stop(context.currentTime + VoicePlayer.FADE);
		this._current = null;
		this._endsAt = 0;
	}

	private output(context: AudioContext): AudioNode {
		const master = this._engine.master;

		if (!this._analyser && master) {
			this._analyser = context.createAnalyser();
			this._analyser.fftSize = 512;
			this._samples = new Uint8Array(new ArrayBuffer(this._analyser.fftSize));
			this._analyser.connect(master);
		}

		return this._analyser ?? context.destination;
	}

	private chain(context: AudioContext, speaker: Speaker): IVoiceChain {
		let chain = this._chains.get(speaker);

		if (!chain) {
			chain = this.build(context, speaker);
			this._chains.set(speaker, chain);
		}

		return chain;
	}

	private build(context: AudioContext, speaker: Speaker): IVoiceChain {
		const output = this.output(context);

		switch (speaker) {
			case 'Kai':
				return { input: this.radio(context, output), playbackRate: 1 };
			case 'Mara':
				return { input: this.recorder(context, output), playbackRate: 1 };
			case 'The Deep':
				return { input: this.abyss(context, output), playbackRate: 0.9 };
			default: {
				const gain = context.createGain();
				gain.gain.value = 1;
				gain.connect(output);

				return { input: gain, playbackRate: 1 };
			}
		}
	}

	/** Band-limited and slightly overdriven: a voice over a boat radio. */
	private radio(context: AudioContext, output: AudioNode): AudioNode {
		const highpass = context.createBiquadFilter();
		const lowpass = context.createBiquadFilter();
		const drive = context.createWaveShaper();
		const gain = context.createGain();

		highpass.type = 'highpass';
		highpass.frequency.value = 380;
		lowpass.type = 'lowpass';
		lowpass.frequency.value = 3200;
		drive.curve = VoicePlayer.softClip(2.2);
		gain.gain.value = 0.9;

		highpass.connect(lowpass).connect(drive).connect(gain).connect(output);

		return highpass;
	}

	/** Warm and a little dull: a log on an old recorder. */
	private recorder(context: AudioContext, output: AudioNode): AudioNode {
		const shelf = context.createBiquadFilter();
		const lowpass = context.createBiquadFilter();

		shelf.type = 'highshelf';
		shelf.frequency.value = 5000;
		shelf.gain.value = -5;
		lowpass.type = 'lowpass';
		lowpass.frequency.value = 8000;

		shelf.connect(lowpass).connect(output);

		return shelf;
	}

	/** Slowed, low-passed and drowned in a long reverb: the voice under everything. */
	private abyss(context: AudioContext, output: AudioNode): AudioNode {
		const input = context.createGain();
		const lowpass = context.createBiquadFilter();
		const reverb = context.createConvolver();
		const wet = context.createGain();
		const dry = context.createGain();

		lowpass.type = 'lowpass';
		lowpass.frequency.value = 2600;
		reverb.buffer = VoicePlayer.impulse(context, 4.5);
		wet.gain.value = 0.75;
		dry.gain.value = 0.55;

		input.connect(lowpass);
		lowpass.connect(dry).connect(output);
		lowpass.connect(reverb).connect(wet).connect(output);

		return input;
	}

	private static softClip(amount: number): Float32Array<ArrayBuffer> {
		const curve = new Float32Array(new ArrayBuffer(1024 * 4));

		for (let i = 0; i < 1024; i++) {
			const x = (i / 1023) * 2 - 1;
			curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
		}

		return curve;
	}

	/** A decaying noise burst: a large, dark space. */
	private static impulse(context: AudioContext, seconds: number): AudioBuffer {
		const length = Math.floor(context.sampleRate * seconds);
		const buffer = context.createBuffer(2, length, context.sampleRate);

		for (let channel = 0; channel < 2; channel++) {
			const data = buffer.getChannelData(channel);

			for (let i = 0; i < length; i++) {
				data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
			}
		}

		return buffer;
	}
}
