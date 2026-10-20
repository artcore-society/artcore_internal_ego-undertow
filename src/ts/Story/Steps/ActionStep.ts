import type IStoryStep from './IStoryStep.ts';
import type { IObjective } from './IStoryStep.ts';
import type IStoryContext from '../IStoryContext.ts';

/** Changes something in the world and moves straight on. */
export default class ActionStep implements IStoryStep {
	public readonly isInstant = true;

	private readonly _action: (context: IStoryContext) => void;

	constructor(action: (context: IStoryContext) => void) {
		this._action = action;
	}

	public enter(context: IStoryContext): void {
		this._action(context);
	}

	public update(): boolean {
		return true;
	}

	public exit(): void {
		// Instant
	}

	public objective(): IObjective | null {
		return null;
	}
}
