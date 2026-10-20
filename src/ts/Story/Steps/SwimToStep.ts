import type { Vector3 } from 'three';
import type IStoryStep from './IStoryStep.ts';
import type { IObjective } from './IStoryStep.ts';
import type IStoryContext from '../IStoryContext.ts';

/** Marks a destination with the signal beacon and completes when the diver gets there. Arrival is a checkpoint. */
export default class SwimToStep implements IStoryStep {
	public readonly isInstant = false;

	private readonly _title: string;
	private readonly _target: Vector3 | (() => Vector3);
	private readonly _radius: number;

	/** @param target a point, or a function for moving targets (the whale) */
	constructor(title: string, target: Vector3 | (() => Vector3), radius: number) {
		this._title = title;
		this._target = target;
		this._radius = radius;
	}

	public enter(context: IStoryContext): void {
		context.setSignal(this.target());
	}

	public update(context: IStoryContext): boolean {
		const target = this.target();

		if (typeof this._target === 'function') {
			context.setSignal(target);
		}

		return context.diver.position.distanceTo(target) < this._radius;
	}

	public exit(context: IStoryContext): void {
		context.setSignal(null);
		context.setCheckpoint(context.diver.position, context.diver.yaw);
	}

	public objective(): IObjective {
		return { title: this._title };
	}

	private target(): Vector3 {
		return typeof this._target === 'function' ? this._target() : this._target;
	}
}
