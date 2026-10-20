import type { Vector3 } from 'three';
import type IStoryStep from './IStoryStep.ts';
import type { IObjective } from './IStoryStep.ts';
import type IStoryContext from '../IStoryContext.ts';

/** The signal rides on a guide (the whale) while the diver follows; done once they reach the destination. */
export default class FollowStep implements IStoryStep {
	public readonly isInstant = false;

	private readonly _title: string;
	private readonly _guide: () => Vector3;
	private readonly _destination: Vector3;
	private readonly _radius: number;

	constructor(title: string, guide: () => Vector3, destination: Vector3, radius: number) {
		this._title = title;
		this._guide = guide;
		this._destination = destination;
		this._radius = radius;
	}

	public enter(context: IStoryContext): void {
		context.setSignal(this._guide());
	}

	public update(context: IStoryContext): boolean {
		context.setSignal(this._guide());

		return context.diver.position.distanceTo(this._destination) < this._radius;
	}

	public exit(context: IStoryContext): void {
		context.setSignal(null);
		context.setCheckpoint(context.diver.position, context.diver.yaw);
	}

	public objective(): IObjective {
		return { title: this._title };
	}
}
