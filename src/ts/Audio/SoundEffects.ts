import type AudioEngine from './AudioEngine.ts';

/** One-shot sounds, synthesised on demand. */
export default class SoundEffects {
	private readonly _engine: AudioEngine;

	constructor(engine: AudioEngine) {
		this._engine = engine;
	}

	/** Regulator inhale: a filtered hiss that swells and falls. */
	public inhale(level = 1): void {
		this.noise(1.1, 900, 2.5, 0.14 * level, 0.35);
	}

	/** Exhale: a rush of bubbles, a burble of quick rising blips. */
	public exhale(level = 1): void {
		const { context, master } = this._engine;

		if (!context || !master) {
			return;
		}

		this.noise(0.9, 420, 1.2, 0.12 * level, 0.05);

		for (let i = 0; i < 9; i++) {
			const start = context.currentTime + i * 0.06 + Math.random() * 0.04;
			const oscillator = context.createOscillator();
			const gain = context.createGain();
			oscillator.frequency.setValueAtTime(220 + Math.random() * 260, start);
			oscillator.frequency.exponentialRampToValueAtTime(700 + Math.random() * 500, start + 0.07);
			gain.gain.setValueAtTime(0, start);
			gain.gain.linearRampToValueAtTime(0.05 * level, start + 0.01);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
			oscillator.connect(gain).connect(master);
			oscillator.start(start);
			oscillator.stop(start + 0.1);
		}
	}

	/** Shard pickup: a glassy two-note chime, higher with every shard. */
	public chime(count: number): void {
		const base = 660 * Math.pow(2, (count % 7) / 12);
		this.tone(base, 0, 1.4, 0.16);
		this.tone(base * 1.5, 0.09, 1.6, 0.11);
	}

	/** A discovery: a soft rising arpeggio. */
	public discovery(): void {
		[392, 494, 587, 784].forEach((frequency, index) => this.tone(frequency, index * 0.14, 2.2, 0.1));
	}

	/** Radio crackle before a line of dialogue. */
	public radio(): void {
		this.noise(0.16, 2400, 3, 0.07, 0.01);
		this.tone(1320, 0, 0.08, 0.03);
	}

	/** Stone grinding awake: a low saw with a long tail. */
	public rumble(): void {
		const { context, master } = this._engine;

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
		gain.gain.linearRampToValueAtTime(0.4, now + 0.6);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 4);
		oscillator.connect(filter).connect(gain).connect(master);
		oscillator.start(now);
		oscillator.stop(now + 4.1);
		this.noise(3.5, 140, 0.8, 0.3, 0.4);
	}

	/** Humpback song: slow sliding moans with vibrato, echoing. */
	public whaleSong(): void {
		const { context, master } = this._engine;

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

		const phrases: [number, number, number, number][] = [
			[180, 320, 0, 2.6],
			[340, 210, 2.2, 2.2],
			[140, 120, 4.6, 3]
		];

		phrases.forEach(([from, to, offset, duration]) => {
			const start = context.currentTime + offset;
			const oscillator = context.createOscillator();
			const vibrato = context.createOscillator();
			const vibratoDepth = context.createGain();
			const gain = context.createGain();

			oscillator.type = 'sine';
			oscillator.frequency.setValueAtTime(from, start);
			oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
			vibrato.frequency.value = 5.5;
			vibratoDepth.gain.value = 6;
			vibrato.connect(vibratoDepth).connect(oscillator.frequency);
			gain.gain.setValueAtTime(0, start);
			gain.gain.linearRampToValueAtTime(0.2, start + duration * 0.3);
			gain.gain.linearRampToValueAtTime(0, start + duration);
			oscillator.connect(gain).connect(filter);
			oscillator.start(start);
			vibrato.start(start);
			oscillator.stop(start + duration + 0.05);
			vibrato.stop(start + duration + 0.05);
		});

		// The echo loop never goes quiet on its own; cut it once the song has faded
		window.setTimeout(() => {
			delay.disconnect();
			feedback.disconnect();
			filter.disconnect();
		}, 12000);
	}

	/** Low air: a heartbeat. */
	public heartbeat(): void {
		this.thump(0, 0.5);
		this.thump(0.22, 0.32);
	}

	private thump(offset: number, level: number): void {
		const { context, master } = this._engine;

		if (!context || !master) {
			return;
		}

		const start = context.currentTime + offset;
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.frequency.setValueAtTime(70, start);
		oscillator.frequency.exponentialRampToValueAtTime(38, start + 0.18);
		gain.gain.setValueAtTime(level, start);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
		oscillator.connect(gain).connect(master);
		oscillator.start(start);
		oscillator.stop(start + 0.25);
	}

	private tone(frequency: number, offset: number, duration: number, level: number): void {
		const { context, master } = this._engine;

		if (!context || !master) {
			return;
		}

		const start = context.currentTime + offset;
		const oscillator = context.createOscillator();
		const gain = context.createGain();
		oscillator.type = 'sine';
		oscillator.frequency.value = frequency;
		gain.gain.setValueAtTime(0, start);
		gain.gain.linearRampToValueAtTime(level, start + 0.01);
		gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
		oscillator.connect(gain).connect(master);
		oscillator.start(start);
		oscillator.stop(start + duration + 0.05);
	}

	private noise(duration: number, frequency: number, q: number, level: number, attack: number): void {
		const { context, master, noiseBuffer } = this._engine;

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
