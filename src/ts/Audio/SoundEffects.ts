import type AudioEngine from './AudioEngine.ts';

/** One-shot sounds, synthesised on demand. */
/** [from Hz, to Hz, offset s, duration s]: one sweep of a whale's song. */
export type WhalePhrase = readonly [number, number, number, number];

export const WHALE_SONG = {
	/** Somewhere down the Whale Road. */
	distant: [
		[180, 320, 0, 2.6],
		[340, 210, 2.2, 2.2],
		[140, 120, 4.6, 3]
	],
	/** Close by, as it turns to lead: a low call, a bright answer, settling. */
	greeting: [
		[120, 260, 0, 2.2],
		[420, 520, 1.8, 1.2],
		[500, 240, 2.9, 2.4],
		[200, 150, 5, 3.2]
	],
	/** Leaving over the temple: rising cries, then one long moan into the dark. */
	farewell: [
		[160, 380, 0, 2],
		[300, 560, 1.7, 1.6],
		[520, 300, 3.1, 1.8],
		[220, 90, 4.6, 5.5]
	]
} as const satisfies Record<string, readonly WhalePhrase[]>;

export default class SoundEffects {
	private readonly _engine: AudioEngine;

	constructor(engine: AudioEngine) {
		this._engine = engine;
	}

	/** Regulator inhale: a filtered hiss that swells and falls. */
	public inhale(level = 1): void {
		this.noise(1.1, 900, 2.5, 0.05 * level, 0.35);
	}

	/** Exhale: a rush of bubbles, a burble of quick rising blips. */
	public exhale(level = 1): void {
		const { context, effects: master } = this._engine;

		if (!context || !master) {
			return;
		}

		this.noise(0.9, 420, 1.2, 0.045 * level, 0.05);

		for (let i = 0; i < 9; i++) {
			const start = context.currentTime + i * 0.06 + Math.random() * 0.04;
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			oscillator.frequency.setValueAtTime(220 + Math.random() * 260, start);
			oscillator.frequency.exponentialRampToValueAtTime(700 + Math.random() * 500, start + 0.07);
			gain.gain.setValueAtTime(0, start);
			gain.gain.linearRampToValueAtTime(0.02 * level, start + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
			oscillator.connect(gain).connect(master);
			oscillator.start(start);
			oscillator.stop(start + 0.1);
		}
	}

	/** Shard pickup: a glassy two-note chime, higher with every shard. */
	public chime(count: number): void {
		const base = 660 * Math.pow(2, (count % 7) / 12);
		this.tone(base, 0, 1.6, 0.06);
		this.tone(base * 1.5, 0.09, 1.8, 0.04);
	}

	/** A discovery: a soft rising arpeggio. */
	public discovery(): void {
		[392, 494, 587, 784].forEach((frequency, index) => this.tone(frequency, index * 0.16, 2.6, 0.045));
	}

	/** Radio crackle before a line of dialogue. */
	public radio(): void {
		this.noise(0.14, 2200, 3, 0.03, 0.01);
		this.tone(1320, 0, 0.08, 0.012);
	}

	/**
	 * Thunder heard through the water: a muffled crack, then a long low roll.
	 * @param distance metres to the strike; further is later and softer
	 */
	public thunder(distance: number): void {
		const { context, effects: master, noiseBuffer } = this._engine;

		if (!context || !master || !noiseBuffer) {
			return;
		}

		const start = context.currentTime + distance / 343;
		const level = Math.max(0.08, 0.38 - distance / 5000);
		const source = context.createBufferSource();
		const lowpass = context.createBiquadFilter();
		const gain = context.createGain();

		source.buffer = noiseBuffer;
		source.loop = true;
		lowpass.type = 'lowpass';
		lowpass.frequency.setValueAtTime(420, start);
		lowpass.frequency.exponentialRampToValueAtTime(90, start + 3);
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(level, start + 0.08);
		gain.gain.exponentialRampToValueAtTime(level * 0.35, start + 0.9);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + 4.5);
		source.connect(lowpass).connect(gain).connect(master);
		source.start(start, Math.random());
		source.stop(start + 4.6);
	}

	/** A small trickle of bubbles somewhere nearby: a fish, a crab, gas from the sand. */
	public trickle(): void {
		const { context, effects: master } = this._engine;

		if (!context || !master) {
			return;
		}

		const count = 3 + Math.floor(Math.random() * 6);
		const pan = context.createStereoPanner();
		pan.pan.value = Math.random() * 1.6 - 0.8;
		pan.connect(master);

		for (let i = 0; i < count; i++) {
			const start = context.currentTime + i * (0.05 + Math.random() * 0.08);
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			const pitch = 500 + Math.random() * 700;

			oscillator.frequency.setValueAtTime(pitch, start);
			oscillator.frequency.exponentialRampToValueAtTime(pitch * 1.8, start + 0.06);
			gain.gain.setValueAtTime(0, start);
			gain.gain.linearRampToValueAtTime(0.012, start + 0.008);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);
			oscillator.connect(gain).connect(pan);
			oscillator.start(start);
			oscillator.stop(start + 0.1);
		}
	}

	/** A whale far away: one long, low, sliding call, mostly echo. */
	public distantWhale(): void {
		const { context, effects: master } = this._engine;

		if (!context || !master) {
			return;
		}

		const start = context.currentTime;
		const duration = 3 + Math.random() * 2;
		const from = 120 + Math.random() * 120;
		const oscillator = context.createOscillator();
		const lowpass = context.createBiquadFilter();
		const gain = context.createGain();
		const delay = context.createDelay(2);
		const feedback = context.createGain();

		oscillator.frequency.setValueAtTime(from, start);
		oscillator.frequency.exponentialRampToValueAtTime(from * (Math.random() > 0.5 ? 1.6 : 0.6), start + duration);
		lowpass.type = 'lowpass';
		lowpass.frequency.value = 500;
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(0.04, start + duration * 0.35);
		gain.gain.linearRampToValueAtTime(0, start + duration);
		delay.delayTime.value = 0.9;
		feedback.gain.value = 0.55;

		oscillator.connect(lowpass).connect(gain);
		gain.connect(master);
		gain.connect(delay).connect(feedback).connect(delay);
		delay.connect(master);
		oscillator.start(start);
		oscillator.stop(start + duration + 0.05);

		window.setTimeout(
			() => {
				delay.disconnect();
				feedback.disconnect();
			},
			(duration + 8) * 1000
		);
	}

	/** Old timber and iron settling: a slow, pitch-bending groan from the wreck. */
	public creak(): void {
		const { context, effects: master } = this._engine;

		if (!context || !master) {
			return;
		}

		const start = context.currentTime;
		const duration = 1.2 + Math.random() * 1.6;
		const oscillator = context.createOscillator();
		const bandpass = context.createBiquadFilter();
		const gain = context.createGain();
		const pitch = 70 + Math.random() * 60;

		oscillator.type = 'sawtooth';
		oscillator.frequency.setValueAtTime(pitch, start);
		oscillator.frequency.linearRampToValueAtTime(pitch * (0.7 + Math.random() * 0.6), start + duration);
		bandpass.type = 'bandpass';
		bandpass.frequency.value = 380 + Math.random() * 300;
		bandpass.Q.value = 6;
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(0.05, start + duration * 0.3);
		gain.gain.linearRampToValueAtTime(0, start + duration);
		oscillator.connect(bandpass).connect(gain).connect(master);
		oscillator.start(start);
		oscillator.stop(start + duration + 0.05);
	}

	/** Something enormous far below: a slow subsonic groan. */
	public groan(): void {
		const { context, effects: master } = this._engine;

		if (!context || !master) {
			return;
		}

		const start = context.currentTime;
		const oscillator = context.createOscillator();
		const lowpass = context.createBiquadFilter();
		const gain = context.createGain();

		oscillator.type = 'triangle';
		oscillator.frequency.setValueAtTime(38, start);
		oscillator.frequency.linearRampToValueAtTime(29, start + 5);
		lowpass.type = 'lowpass';
		lowpass.frequency.value = 140;
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(0.18, start + 1.5);
		gain.gain.linearRampToValueAtTime(0, start + 5.5);
		oscillator.connect(lowpass).connect(gain).connect(master);
		oscillator.start(start);
		oscillator.stop(start + 5.6);
	}

	/** Stone grinding awake: a low saw with a long tail. */
	public rumble(): void {
		const { context, effects: master } = this._engine;

		if (!context || !master) {
			return;
		}

		const now = context.currentTime;
		const oscillator = context.createOscillator();
		const filter = context.createBiquadFilter();
		const gain = context.createGain();
		oscillator.type = 'sawtooth';
		oscillator.frequency.setValueAtTime(48, now);
		oscillator.frequency.linearRampToValueAtTime(32, now + 3.5);
		filter.type = 'lowpass';
		filter.frequency.value = 220;
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(0.2, now + 0.6);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 4);
		oscillator.connect(filter).connect(gain).connect(master);
		oscillator.start(now);
		oscillator.stop(now + 4.1);
		this.noise(3.5, 140, 0.8, 0.15, 0.4);
	}

	/** Humpback song: slow sliding moans with vibrato, echoing. */
	/**
	 * A humpback's song, echoing down the canyon. Close by (`level` higher) it's fuller: an octave
	 * overtone sings along with every phrase.
	 * @param phrases [from Hz, to Hz, offset s, duration s] each
	 */
	public whaleSong(phrases: readonly WhalePhrase[] = WHALE_SONG.distant, level = 0.11): void {
		const { context, effects: master } = this._engine;

		if (!context || !master) {
			return;
		}

		const delay = context.createDelay(2);
		const feedback = context.createGain();
		const filter = context.createBiquadFilter();
		delay.delayTime.value = 0.7;
		feedback.gain.value = 0.45;
		filter.type = 'lowpass';
		filter.frequency.value = 900;
		delay.connect(feedback).connect(delay);
		filter.connect(master);
		filter.connect(delay);
		delay.connect(master);

		const overtone = Math.min(1, Math.max(0, (level - 0.11) / 0.1)) * 0.35;
		let end = 0;

		phrases.forEach(([from, to, offset, duration]) => {
			const start = context.currentTime + offset;
			const vibrato = context.createOscillator();
			const gain = context.createGain();
			end = Math.max(end, offset + duration);

			vibrato.frequency.value = 5.5;
			gain.gain.setValueAtTime(0, start);
			gain.gain.linearRampToValueAtTime(level, start + duration * 0.3);
			gain.gain.linearRampToValueAtTime(0, start + duration);
			gain.connect(filter);

			[1, ...(overtone > 0 ? [2] : [])].forEach((harmonic) => {
				const oscillator = context.createOscillator();
				const vibratoDepth = context.createGain();
				const voice = context.createGain();

				oscillator.type = 'sine';
				oscillator.frequency.setValueAtTime(from * harmonic, start);
				oscillator.frequency.exponentialRampToValueAtTime(to * harmonic, start + duration);
				vibratoDepth.gain.value = 6 * harmonic;
				voice.gain.value = harmonic === 1 ? 1 : overtone;
				vibrato.connect(vibratoDepth).connect(oscillator.frequency);
				oscillator.connect(voice).connect(gain);
				oscillator.start(start);
				oscillator.stop(start + duration + 0.05);
			});

			vibrato.start(start);
			vibrato.stop(start + duration + 0.05);
		});

		// The echo loop never goes quiet on its own; cut it once the song has faded
		window.setTimeout(
			() => {
				delay.disconnect();
				feedback.disconnect();
				filter.disconnect();
			},
			(end + 7) * 1000
		);
	}

	private tone(frequency: number, offset: number, duration: number, level: number): void {
		const { context, effects: master } = this._engine;

		if (!context || !master) {
			return;
		}

		const start = context.currentTime + offset;
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.type = 'sine';
		oscillator.frequency.value = frequency;
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(level, start + 0.025);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		oscillator.connect(gain).connect(master);
		oscillator.start(start);
		oscillator.stop(start + duration + 0.05);
	}

	private noise(duration: number, frequency: number, q: number, level: number, attack: number): void {
		const { context, effects: master, noiseBuffer } = this._engine;

		if (!context || !master || !noiseBuffer) {
			return;
		}

		const start = context.currentTime;
		const source = context.createBufferSource();
		const filter = context.createBiquadFilter();
		const gain = context.createGain();
		source.buffer = noiseBuffer;
		filter.type = 'bandpass';
		filter.frequency.value = frequency;
		filter.Q.value = q;
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(level, start + attack);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		source.connect(filter).connect(gain).connect(master);
		source.start(start, Math.random());
		source.stop(start + duration + 0.05);
	}
}
