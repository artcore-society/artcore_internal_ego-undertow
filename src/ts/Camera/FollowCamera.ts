import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { SURFACE_Y } from '../Config/world.ts';
import { damp, dampVector3 } from '../Helpers/math.ts';
import type IDiverState from '../Contracts/IDiverState.ts';
import type IFrameContext from '../Contracts/IFrameContext.ts';
import type IResizable from '../Contracts/IResizable.ts';
import type IViewportSize from '../Contracts/IViewportSize.ts';
import type ITerrainSampler from '../Contracts/ITerrainSampler.ts';
import type PointerOrbit from './PointerOrbit.ts';

export const CameraMode = {
	CINEMATIC: 'cinematic',
	FOLLOW: 'follow',
	SHOWCASE: 'showcase'
} as const;

export type CameraMode = (typeof CameraMode)[keyof typeof CameraMode];

/** Spring camera behind the diver: slow orbit in the intro, follow while swimming, short cinematics on cue. */
export default class FollowCamera extends PerspectiveCamera implements IResizable {
	private static readonly DISTANCE = 5.2;
	private static readonly HEIGHT = 1.5;
	private static readonly BASE_FOV = 60;

	public mode: CameraMode = CameraMode.CINEMATIC;

	private readonly _terrain: ITerrainSampler;
	private readonly _orbit: PointerOrbit;
	private readonly _desiredPosition = new Vector3();
	private readonly _desiredTarget = new Vector3();
	private readonly _lookTarget = new Vector3();
	private readonly _showcaseTarget = new Vector3();
	private _showcaseAngle = 0;
	private _showcaseDistance = 24;
	private _trauma = 0;

	constructor(terrain: ITerrainSampler, orbit: PointerOrbit) {
		// Fog swallows everything past ~150 m; a short far plane keeps depth precision and culling tight
		super(FollowCamera.BASE_FOV, 1, 0.1, 320);

		this._terrain = terrain;
		this._orbit = orbit;
	}

	public resize(size: IViewportSize): void {
		this.aspect = size.width / size.height;
		this.updateProjectionMatrix();
	}

	/** Circles a point of interest until released back to the diver. */
	public showcase(target: Vector3 | null, from: Vector3, distance = 24): void {
		if (!target) {
			this.mode = CameraMode.FOLLOW;

			return;
		}

		this._showcaseTarget.copy(target);
		this._showcaseAngle = Math.atan2(from.x - target.x, from.z - target.z);
		this._showcaseDistance = distance;
		this.mode = CameraMode.SHOWCASE;
	}

	public snapBehind(diver: IDiverState): void {
		this.computeFollow(diver);
		this.position.copy(this._desiredPosition);
		this._lookTarget.copy(this._desiredTarget);
		this.lookAt(this._lookTarget);
	}

	/** Adds screen shake (0..1), decays over time. */
	public shake(amount: number): void {
		this._trauma = Math.min(1, this._trauma + amount);
	}

	public follow(diver: IDiverState, frame: IFrameContext): void {
		this._orbit.update(frame.delta);

		switch (this.mode) {
			case CameraMode.CINEMATIC:
				this.computeCinematic(diver, frame.elapsed);
				break;
			case CameraMode.SHOWCASE:
				this.computeShowcase(frame.delta);
				break;
			default:
				this.computeFollow(diver);
		}

		const stiffness = this.mode === CameraMode.FOLLOW ? 5 : 1.2;
		this.keepClear(this._desiredPosition);
		dampVector3(this.position, this._desiredPosition, stiffness, frame.delta);
		dampVector3(this._lookTarget, this._desiredTarget, stiffness * 1.4, frame.delta);
		this.keepClear(this.position);
		this.lookAt(this._lookTarget);

		this.fov = damp(this.fov, FollowCamera.BASE_FOV + diver.speedRatio * (diver.isSprinting ? 12 : 5), 3, frame.delta);
		this.applyShake(frame);
		this.updateProjectionMatrix();
	}

	private computeFollow(diver: IDiverState): void {
		const yaw = diver.yaw + this._orbit.yaw;
		const pitch = 0.22 + this._orbit.pitch;
		const horizontal = Math.cos(pitch) * FollowCamera.DISTANCE;

		this._desiredPosition.set(
			diver.position.x + Math.sin(yaw) * horizontal,
			diver.position.y + FollowCamera.HEIGHT + Math.sin(pitch) * FollowCamera.DISTANCE,
			diver.position.z + Math.cos(yaw) * horizontal
		);
		this._desiredTarget.set(
			diver.position.x - Math.sin(diver.yaw) * 2.5,
			diver.position.y + 0.5 + diver.velocity.y * 0.25,
			diver.position.z - Math.cos(diver.yaw) * 2.5
		);
	}

	private computeCinematic(diver: IDiverState, elapsed: number): void {
		const angle = elapsed * 0.07;

		this._desiredPosition.set(
			diver.position.x + Math.sin(angle) * 12,
			diver.position.y + 3 + Math.sin(elapsed * 0.2) * 1.2,
			diver.position.z + Math.cos(angle) * 12
		);
		this._desiredTarget.copy(diver.position).setY(diver.position.y + 1.5);
	}

	private computeShowcase(delta: number): void {
		this._showcaseAngle += delta * 0.12;

		this._desiredPosition.set(
			this._showcaseTarget.x + Math.sin(this._showcaseAngle) * this._showcaseDistance,
			this._showcaseTarget.y + this._showcaseDistance * 0.3,
			this._showcaseTarget.z + Math.cos(this._showcaseAngle) * this._showcaseDistance
		);
		this._desiredTarget.copy(this._showcaseTarget);
	}

	/** Never under the seabed, never above the surface. */
	private keepClear(position: Vector3): void {
		const floor = this._terrain.heightAt(position.x, position.z) + 0.8;
		position.y = MathUtils.clamp(position.y, floor, SURFACE_Y - 0.4);
	}

	private applyShake(frame: IFrameContext): void {
		if (this._trauma <= 0) {
			return;
		}

		const strength = this._trauma * this._trauma * 0.06;
		this.rotation.x += Math.sin(frame.elapsed * 37) * strength;
		this.rotation.y += Math.sin(frame.elapsed * 41 + 1.3) * strength;
		this._trauma = Math.max(0, this._trauma - frame.delta * 1.2);
	}
}
