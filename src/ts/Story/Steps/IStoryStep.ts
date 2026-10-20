import type IStoryContext from '../IStoryContext.ts';

export interface IObjective {
	readonly title: string;
	readonly progress?: { readonly current: number; readonly total: number };
}

/** One beat of the story. Steps run in sequence; update() returns true once the beat is done. */
export default interface IStoryStep {
	enter(context: IStoryContext): void;
	update(context: IStoryContext, delta: number): boolean;
	exit(context: IStoryContext): void;
	/** What the HUD shows while this step runs (null keeps the previous objective). */
	objective(context: IStoryContext): IObjective | null;
	/** True for steps that finish on the frame they start (actions, non-blocking lines). */
	readonly isInstant: boolean;
}
