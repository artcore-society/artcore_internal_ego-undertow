/** Kai on the boat radio, Mara's voice on the signal, the diver, and the voice under everything. */
export type Speaker = 'Kai' | 'Mara' | 'You' | 'The Deep';

export interface IDialogueLine {
	readonly speaker: Speaker;
	readonly text: string;
}

export interface ISpokenLine extends IDialogueLine {
	readonly id: number;
	/** Seconds the line stays up. */
	readonly duration: number;
}

type LineListener = (line: ISpokenLine | null) => void;

/** Plays queued dialogue lines one after another, timed by their length. */
export default class Narrator {
	private static readonly SECONDS_PER_CHARACTER = 0.06;
	private static readonly MINIMUM_DURATION = 3.2;

	private readonly _queue: IDialogueLine[] = [];
	private _current: ISpokenLine | null = null;
	private _remaining = 0;
	private _nextId = 0;
	private _listener: LineListener | null = null;
	private _onLine: (() => void) | null = null;

	public get isSpeaking(): boolean {
		return this._current !== null || this._queue.length > 0;
	}

	public onChange(listener: LineListener): void {
		this._listener = listener;
	}

	/** Called whenever a new line starts (radio crackle). */
	public onLine(listener: () => void): void {
		this._onLine = listener;
	}

	public say(...lines: IDialogueLine[]): void {
		this._queue.push(...lines);
	}

	/** Skips the line on screen. */
	public skip(): void {
		this._remaining = 0;
	}

	public clear(): void {
		this._queue.length = 0;
		this._current = null;
		this._remaining = 0;
		this._listener?.(null);
	}

	public update(delta: number): void {
		if (this._current) {
			this._remaining -= delta;

			if (this._remaining > 0) {
				return;
			}

			this._current = null;
		}

		const next = this._queue.shift();

		if (!next) {
			this._listener?.(null);

			return;
		}

		const text = next.text;
		const duration = Math.max(Narrator.MINIMUM_DURATION, text.length * Narrator.SECONDS_PER_CHARACTER);

		this._current = { speaker: next.speaker, text, id: this._nextId++, duration };
		this._remaining = duration;
		this._listener?.(this._current);
		this._onLine?.();
	}
}
