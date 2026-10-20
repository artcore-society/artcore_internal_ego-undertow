import { damp } from '../Helpers/math.ts';
import Rail, { type IRailSample } from './Rail.ts';
import type { ICaption, IChapter, IJourney, IStop, StopId } from './IJourney.ts';

export interface IJourneyListener {
	chapterChanged(chapter: IChapter | null): void;
	captionChanged(caption: ICaption | null): void;
	stopChanged(stop: IStop | null): void;
	finished(): void;
}

/**
 * Owns where the diver is along the journey (0..1). Scrolling moves a target; the camera's progress
 * eases after it. Stops gate the target until their hotspot is used. Chapters, captions and stops are
 * reported only when they change.
 */
export default class JourneyDirector {
	private static readonly EASING = 1.8;
	private static readonly ARRIVAL = 0.0015;
	private static readonly END = 0.995;

	public readonly rail: Rail;

	private readonly _journey: IJourney;
	private readonly _listener: IJourneyListener;
	private readonly _unlocked = new Set<StopId>();
	private _target = 0;
	private _progress = 0;
	private _chapter: IChapter | null = null;
	private _caption: ICaption | null = null;
	private _stop: IStop | null = null;
	private _hasFinished = false;

	constructor(journey: IJourney, listener: IJourneyListener) {
		this._journey = journey;
		this._listener = listener;
		this.rail = new Rail(journey.shots);
	}

	public get progress(): number {
		return this._progress;
	}

	public get activeStop(): IStop | null {
		return this._stop;
	}

	/** The next stop still ahead (where Mara's signal points). */
	public get nextStop(): IStop | null {
		return this._journey.stops.find((stop) => !this._unlocked.has(stop.id)) ?? null;
	}

	public get chapter(): IChapter | null {
		return this._chapter;
	}

	public get sample(): IRailSample {
		return this.rail.sample(this._progress);
	}

	public restart(): void {
		this._unlocked.clear();
		this._target = 0;
		this._progress = 0;
		this._hasFinished = false;
		this.setStop(null);
	}

	public scroll(amount: number): void {
		// At a stop the journey holds still, like a cutscene, until the hotspot is used
		if (this._stop) {
			return;
		}

		this._target = Math.min(this.gate(), Math.max(0, this._target + amount));
	}

	/** Uses the hotspot of the stop the diver is waiting at, which opens the way on. */
	public activate(): void {
		const stop = this._stop;

		if (!stop) {
			return;
		}

		this._unlocked.add(stop.id);
		stop.onActivate();
		this.setStop(null);
		// A gentle push past the stop, so the story visibly moves on
		this._target = Math.min(this.gate(), stop.progress + 0.004);
	}

	public update(delta: number): void {
		this._progress = damp(this._progress, this._target, JourneyDirector.EASING, delta);

		this.checkStop();
		this.checkChapter();
		this.checkCaption();

		if (!this._hasFinished && this._progress > JourneyDirector.END) {
			this._hasFinished = true;
			this._listener.finished();
		}
	}

	/** Furthest the target may go: the first stop not yet unlocked. */
	private gate(): number {
		return this._journey.stops.find((stop) => !this._unlocked.has(stop.id))?.progress ?? 1;
	}

	private checkStop(): void {
		const waiting = this._journey.stops.find(
			(stop) => !this._unlocked.has(stop.id) && Math.abs(stop.progress - this._progress) < JourneyDirector.ARRIVAL
		);

		if (waiting && waiting !== this._stop) {
			// Settle exactly on the stop's shot
			this._target = waiting.progress;
			this.setStop(waiting);
		}
	}

	private checkChapter(): void {
		const chapter =
			this._journey.chapters.find((candidate) => this._progress >= candidate.from && this._progress < candidate.to) ??
			null;

		if (chapter !== this._chapter) {
			this._chapter = chapter;
			this._listener.chapterChanged(chapter);
		}
	}

	private checkCaption(): void {
		const caption =
			this._journey.captions.find((candidate) => this._progress >= candidate.from && this._progress < candidate.to) ??
			null;

		if (caption !== this._caption) {
			this._caption = caption;
			this._listener.captionChanged(caption);
		}
	}

	private setStop(stop: IStop | null): void {
		this._stop = stop;
		this._listener.stopChanged(stop);
	}
}
