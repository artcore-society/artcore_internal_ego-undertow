import type AudioEngine from './AudioEngine.ts';

/** A continuous sound whose loudness is driven from outside (weather, distance to a landmark…). */
export default abstract class AmbientLayer {
	protected readonly engine: AudioEngine;

	private _output: GainNode | null = null;

	constructor(engine: AudioEngine) {
		this.engine = engine;
	}

	public start(): void {
		const { context, master } = this.engine;

		if (this._output || !context || !master) {
			return;
		}

		this._output = context.createGain();
		this._output.gain.value = 0;
		this._output.connect(master);
		this.build(context, this._output);
	}

	/** 0..1 */
	public setLevel(level: number): void {
		const context = this.engine.context;

		if (context && this._output) {
			this._output.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * this.maxGain, context.currentTime, 0.25);
		}
	}

	protected abstract get maxGain(): number;

	protected abstract build(context: AudioContext, output: AudioNode): void;

	protected noiseSource(context: AudioContext): AudioBufferSourceNode {
		const source = context.createBufferSource();
		source.buffer = this.engine.noiseBuffer;
		source.loop = true;
		source.start();

		return source;
	}
}
