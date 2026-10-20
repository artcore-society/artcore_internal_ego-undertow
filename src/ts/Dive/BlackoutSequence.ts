import type Checkpoint from './Checkpoint.ts';

export interface IBlackoutHandlers {
	/** 0..1 how black the screen is. */
	fade(level: number): void;
	teleport(checkpoint: Checkpoint): void;
	setControl(enabled: boolean): void;
}

/** Out of air: fade to black, wake at the last checkpoint with a fresh breath, fade back in. */
export default class BlackoutSequence {
	private static readonly FADE_OUT = 1.6;
	private static readonly HOLD = 1.4;
	private static readonly FADE_IN = 1.8;

	private readonly _handlers: IBlackoutHandlers;
	private _checkpoint: Checkpoint | null = null;
	private _time = -1;

	constructor(handlers: IBlackoutHandlers) {
		this._handlers = handlers;
	}

	public get isActive(): boolean {
		return this._time >= 0;
	}

	public start(checkpoint: Checkpoint): void {
		this._checkpoint = checkpoint;
		this._time = 0;
		this._handlers.setControl(false);
	}

	public cancel(): void {
		this._time = -1;
		this._handlers.fade(0);
	}

	public update(delta: number): void {
		if (this._time < 0 || !this._checkpoint) {
			return;
		}

		const previous = this._time;
		this._time += delta;

		const { FADE_OUT, HOLD, FADE_IN } = BlackoutSequence;

		if (previous < FADE_OUT + HOLD * 0.5 && this._time >= FADE_OUT + HOLD * 0.5) {
			this._handlers.teleport(this._checkpoint);
		}

		if (this._time < FADE_OUT) {
			this._handlers.fade(this._time / FADE_OUT);
		} else if (this._time < FADE_OUT + HOLD) {
			this._handlers.fade(1);
		} else if (this._time < FADE_OUT + HOLD + FADE_IN) {
			this._handlers.fade(1 - (this._time - FADE_OUT - HOLD) / FADE_IN);
		} else {
			this._time = -1;
			this._handlers.fade(0);
			this._handlers.setControl(true);
		}
	}
}
