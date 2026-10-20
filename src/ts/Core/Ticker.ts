import type IFrameContext from '../Contracts/IFrameContext.ts';
import type IDisposable from '../Contracts/IDisposable.ts';

type TickListener = (frame: IFrameContext) => void;

/** Owns the animation loop and hands a clamped frame context to its listeners. */
export default class Ticker implements IDisposable {
	private static readonly MAX_DELTA = 1 / 20;

	private readonly _listeners: TickListener[] = [];
	private _frameId: number | null = null;
	private _previous = 0;
	private _elapsed = 0;

	public get elapsed(): number {
		return this._elapsed;
	}

	public add(listener: TickListener): void {
		this._listeners.push(listener);
	}

	public start(): void {
		if (this._frameId !== null) {
			return;
		}

		this._previous = performance.now();
		this._frameId = requestAnimationFrame(this.tick);
	}

	public stop(): void {
		if (this._frameId !== null) {
			cancelAnimationFrame(this._frameId);
			this._frameId = null;
		}
	}

	public dispose(): void {
		this.stop();
		this._listeners.length = 0;
	}

	private readonly tick = (now: number): void => {
		const delta = Math.min((now - this._previous) / 1000, Ticker.MAX_DELTA);
		this._previous = now;
		this._elapsed += delta;

		const frame: IFrameContext = { delta, elapsed: this._elapsed };

		for (const listener of this._listeners) {
			listener(frame);
		}

		this._frameId = requestAnimationFrame(this.tick);
	};
}
