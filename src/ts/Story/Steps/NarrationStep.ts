import type IStoryStep from './IStoryStep.ts';
import type { IObjective } from './IStoryStep.ts';
import type IStoryContext from '../IStoryContext.ts';
import type { IDialogueLine } from '../Narrator.ts';

/** Speaks a few lines; the story waits until they're done unless told otherwise. */
export default class NarrationStep implements IStoryStep {
	public readonly isInstant: boolean;

	private readonly _lines: readonly IDialogueLine[];

	/** @param blocking when false the story moves on while the lines play */
	constructor(lines: readonly IDialogueLine[], blocking = true) {
		this._lines = lines;
		this.isInstant = !blocking;
	}

	public enter(context: IStoryContext): void {
		context.narrator.say(...this._lines);
	}

	public update(context: IStoryContext): boolean {
		return this.isInstant || !context.narrator.isSpeaking;
	}

	public exit(): void {
		// Nothing to clean up
	}

	public objective(): IObjective | null {
		return null;
	}
}
