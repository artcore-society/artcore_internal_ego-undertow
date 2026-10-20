import type IDisposable from '../Contracts/IDisposable.ts';

/** Owns the AudioContext and the master bus. Browsers only allow starting it from a user gesture. */
export default class AudioEngine implements IDisposable {
	private _context: AudioContext | null = null;
	private _master: GainNode | null = null;
	private _noise: AudioBuffer | null = null;
	private _muted = false;

	public get context(): AudioContext | null {
		return this._context;
	}

	public get master(): GainNode | null {
		return this._master;
	}

	public get isMuted(): boolean {
		return this._muted;
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

			master.gain.value = this._muted ? 0 : 0.8;
			master.connect(compressor).connect(context.destination);

			this._context = context;
			this._master = master;
			this._noise = AudioEngine.createNoise(context);
		}

		if (this._context.state === 'suspended') {
			await this._context.resume();
		}

		return true;
	}

	public toggleMute(): boolean {
		this._muted = !this._muted;

		if (this._context && this._master) {
			this._master.gain.setTargetAtTime(this._muted ? 0 : 0.8, this._context.currentTime, 0.1);
		}

		return this._muted;
	}

	public dispose(): void {
		void this._context?.close();
		this._context = null;
		this._master = null;
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
