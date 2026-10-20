import type { Vector3 } from 'three';
import type { SceneId } from '../Enums/SceneId.ts';
import type IDiverState from '../Contracts/IDiverState.ts';
import type World from '../World/World.ts';
import type Narrator from './Narrator.ts';

/** Everything a story step may look at or change. */
export default interface IStoryContext {
	readonly diver: IDiverState;
	readonly world: World;
	readonly narrator: Narrator;
	/** Shards collected since the dive started. */
	readonly collected: number;
	/** Marks where the signal comes from; null hides it. */
	setSignal(target: Vector3 | null): void;
	/** Where the diver wakes after a blackout. */
	setCheckpoint(position: Vector3, yaw?: number): void;
	activateShards(scene: SceneId): void;
	/** Points the camera at something for a moment; null hands it back to the diver. */
	showcase(target: Vector3 | null, distance?: number): void;
	setIlluminated(enabled: boolean): void;
	/** Story sounds: a chime for discoveries, a rumble for things waking, whale song. */
	cue(sound: 'discovery' | 'rumble' | 'whale'): void;
	shake(amount: number): void;
}
