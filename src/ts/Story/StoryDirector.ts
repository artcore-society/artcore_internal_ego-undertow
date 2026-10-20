import type IChapter from './IChapter.ts';
import type { IChapterCard } from './IChapter.ts';
import type IStoryContext from './IStoryContext.ts';
import type IStoryStep from './Steps/IStoryStep.ts';
import type { IObjective } from './Steps/IStoryStep.ts';

export interface IStoryListener {
	chapterStarted(card: IChapterCard): void;
	objectiveChanged(objective: IObjective | null): void;
	completed(): void;
}

/** Runs the chapters and their steps in order, reporting chapters and objectives. */
export default class StoryDirector {
	private readonly _chapters: readonly IChapter[];
	private readonly _context: IStoryContext;
	private readonly _listener: IStoryListener;
	private _chapterIndex = 0;
	private _stepIndex = -1;
	private _step: IStoryStep | null = null;
	private _lastObjectiveKey = '';
	private _isRunning = false;

	constructor(chapters: readonly IChapter[], context: IStoryContext, listener: IStoryListener) {
		this._chapters = chapters;
		this._context = context;
		this._listener = listener;
	}

	public get isRunning(): boolean {
		return this._isRunning;
	}

	public start(): void {
		this._chapterIndex = 0;
		this._stepIndex = -1;
		this._lastObjectiveKey = '';
		this._isRunning = true;
		this.startChapter();
	}

	public stop(): void {
		this._step?.exit(this._context);
		this._step = null;
		this._isRunning = false;
		this._lastObjectiveKey = '';
		this._listener.objectiveChanged(null);
	}

	public update(delta: number): void {
		if (!this._isRunning || !this._step) {
			return;
		}

		if (this._step.update(this._context, delta)) {
			this.completeStep();
		}

		this.publishObjective();
	}

	private startChapter(): void {
		const chapter = this._chapters[this._chapterIndex];

		if (!chapter) {
			this.finish();

			return;
		}

		this._listener.chapterStarted({ numeral: chapter.numeral, title: chapter.title, subtitle: chapter.subtitle });
		this._stepIndex = -1;
		this.nextStep();
	}

	private completeStep(): void {
		this._step?.exit(this._context);
		this.nextStep();
	}

	private nextStep(): void {
		// Instant steps chain on in a loop, not recursion, so long runs of actions can't blow the stack
		for (;;) {
			const chapter = this._chapters[this._chapterIndex];
			this._stepIndex++;
			const step = chapter?.steps[this._stepIndex];

			if (!step) {
				this._chapterIndex++;
				this.startChapter();

				return;
			}

			this._step = step;
			step.enter(this._context);

			if (!step.isInstant) {
				return;
			}

			step.exit(this._context);
		}
	}

	private publishObjective(): void {
		const objective = this._step?.objective(this._context) ?? null;

		if (!objective) {
			return;
		}

		const key = `${objective.title}|${objective.progress?.current ?? ''}`;

		if (key !== this._lastObjectiveKey) {
			this._lastObjectiveKey = key;
			this._listener.objectiveChanged(objective);
		}
	}

	private finish(): void {
		this._step = null;
		this._isRunning = false;
		this._lastObjectiveKey = '';
		this._listener.objectiveChanged(null);
		this._listener.completed();
	}
}
