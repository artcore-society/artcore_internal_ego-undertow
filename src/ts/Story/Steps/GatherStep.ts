import type IStoryStep from './IStoryStep.ts';
import type { IObjective } from './IStoryStep.ts';
import type IStoryContext from '../IStoryContext.ts';
import type { SceneId } from '../../Enums/SceneId.ts';

/** Collect a number of light shards in one scene. */
export default class GatherStep implements IStoryStep {
	public readonly isInstant = false;

	private readonly _title: string;
	private readonly _scene: SceneId;
	private readonly _count: number;
	private _startCount = 0;

	constructor(title: string, scene: SceneId, count: number) {
		this._title = title;
		this._scene = scene;
		this._count = count;
	}

	public enter(context: IStoryContext): void {
		this._startCount = context.collected;
		context.activateShards(this._scene);
	}

	public update(context: IStoryContext): boolean {
		return this.gathered(context) >= this._count;
	}

	public exit(): void {
		// Leftover shards keep glowing for completionists
	}

	public objective(context: IStoryContext): IObjective {
		return {
			title: this._title,
			progress: { current: Math.min(this._count, this.gathered(context)), total: this._count }
		};
	}

	private gathered(context: IStoryContext): number {
		return context.collected - this._startCount;
	}
}
