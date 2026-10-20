import { Vector3 } from 'three';

/** Where the diver comes to after a blackout: the last place the story said was safe. */
export default class Checkpoint {
	public readonly position = new Vector3();
	public yaw = 0;

	public set(position: Vector3, yaw: number): void {
		this.position.copy(position);
		this.yaw = yaw;
	}
}
