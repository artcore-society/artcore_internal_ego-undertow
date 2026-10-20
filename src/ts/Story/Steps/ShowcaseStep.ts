import type { Vector3 } from 'three';
import type IStoryStep from './IStoryStep.ts';
import type { IObjective } from './IStoryStep.ts';
import type IStoryContext from '../IStoryContext.ts';

/** A short cinematic: the camera circles a point of interest, then returns to the diver. */
export default class ShowcaseStep implements IStoryStep {
	public readonly isInstant = false;

	private readonly _target: Vector3;
	private readonly _duration: number;
	private readonly _distance: number;
	private _elapsed = 0;

	constructor(target: Vector3, duration: number, distance = 24) {
		this._target = target;
		this._duration = duration;
		this._distance = distance;
	}

	public enter(context: IStoryContext): void {
		this._elapsed = 0;
		context.showcase(this._target, this._distance);
	}

	public update(_context: IStoryContext, delta: number): boolean {
		this._elapsed += delta;

		return this._elapsed >= this._duration;
	}

	public exit(context: IStoryContext): void {
		context.showcase(null);
	}

	public objective(): IObjective | null {
		return null;
	}
}
