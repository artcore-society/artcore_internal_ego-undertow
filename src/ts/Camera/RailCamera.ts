import { MathUtils, PerspectiveCamera, Vector3, type Vector2 } from 'three';
import { SURFACE_Y } from '../Config/world.ts';
import { damp } from '../Helpers/math.ts';
import type { IRailSample } from '../Journey/Rail.ts';
import type IFrameContext from '../Contracts/IFrameContext.ts';
import type IResizable from '../Contracts/IResizable.ts';
import type IViewportSize from '../Contracts/IViewportSize.ts';
import type ITerrainSampler from '../Contracts/ITerrainSampler.ts';
import type PointerOrbit from './PointerOrbit.ts';

/**
 * The diver's eyes. Rides the journey rail, breathing gently, with the view following the mouse a
 * little (parallax). At a stop the diver can drag to look around freely.
 */
export default class RailCamera extends PerspectiveCamera implements IResizable {
	private static readonly PARALLAX_YAW = 0.08;
	private static readonly PARALLAX_PITCH = 0.05;
	private static readonly WATER_FAR = 320;
	private static readonly HORIZON_FAR = 2600;

	/** True while dragging may look around (at a stop). */
	public isFree = false;

	/** True once the diver may break the surface (the very end); otherwise the camera stays under it. */
	public isSurfacing = false;

	/** The water's current (m/s across x, z): the diver floats back and forth with it. */
	public current: Readonly<Vector2> | null = null;

	private readonly _terrain: ITerrainSampler;
	private readonly _orbit: PointerOrbit;
	private readonly _direction = new Vector3();
	private readonly _look = new Vector3();
	private readonly _up = new Vector3(0, 1, 0);
	private readonly _side = new Vector3();
	private readonly _pointer = { x: 0, y: 0 };
	private _parallaxYaw = 0;
	private _parallaxPitch = 0;
	private _freedom = 0;

	constructor(terrain: ITerrainSampler, orbit: PointerOrbit) {
		// Fog swallows everything past ~150 m; a short far plane keeps depth precision and culling tight
		super(55, 1, 0.1, RailCamera.WATER_FAR);

		this._terrain = terrain;
		this._orbit = orbit;
		window.addEventListener('pointermove', this.onPointerMove);
	}

	public resize(size: IViewportSize): void {
		this.aspect = size.width / size.height;
		// Portrait screens get a wider vertical view so the scene isn't cropped to a slit
		this.fov = this.aspect < 1 ? 70 : 55;
		this.updateProjectionMatrix();
	}

	public follow(sample: IRailSample, frame: IFrameContext): void {
		this._orbit.update(frame.delta);
		this._freedom = damp(this._freedom, this.isFree ? 1 : 0, 3, frame.delta);
		this._parallaxYaw = damp(this._parallaxYaw, -this._pointer.x * RailCamera.PARALLAX_YAW, 2, frame.delta);
		this._parallaxPitch = damp(this._parallaxPitch, -this._pointer.y * RailCamera.PARALLAX_PITCH, 2, frame.delta);

		// Breathing: a slow rise and fall, a slight sway
		this.position.copy(sample.position);
		this.position.y += Math.sin(frame.elapsed * 1.3) * 0.08;
		this.position.x += Math.sin(frame.elapsed * 0.6) * 0.05;

		// Afloat in the current: pushed a little its way and back on a slow swell
		if (this.current && !this.isSurfacing) {
			const swell = Math.sin(frame.elapsed * 0.35) * 1.3;
			this.position.x += this.current.x * swell;
			this.position.z += this.current.y * swell;
		}

		this.keepClear();

		this._direction.subVectors(sample.target, sample.position).normalize();

		const yaw = this._parallaxYaw + this._orbit.yaw * this._freedom;
		const pitch = MathUtils.clamp(this._parallaxPitch - this._orbit.pitch * this._freedom, -1.2, 1.2);

		this._direction.applyAxisAngle(this._up, yaw);
		this._side.crossVectors(this._direction, this._up).normalize();
		this._direction.applyAxisAngle(this._side, pitch);

		this._look.copy(this.position).add(this._direction);
		this.lookAt(this._look);
		this.rotation.z += Math.sin(frame.elapsed * 0.5) * 0.008;
	}

	/** Where the pointer is, -1..1 across and down the screen (the lamp aims there). */
	public get pointer(): Readonly<{ x: number; y: number }> {
		return this._pointer;
	}

	/** Stops listening to the pointer. */
	public release(): void {
		window.removeEventListener('pointermove', this.onPointerMove);
	}

	/** Above water the view reaches the horizon; below, fog swallows everything well before the far plane. */
	public set reachesHorizon(value: boolean) {
		const far = value ? RailCamera.HORIZON_FAR : RailCamera.WATER_FAR;

		if (this.far !== far) {
			this.far = far;
			this.updateProjectionMatrix();
		}
	}

	/** Never under the seabed, never above the surface (until the end). */
	private keepClear(): void {
		const floor = this._terrain.heightAt(this.position.x, this.position.z) + 1.2;
		this.position.y = MathUtils.clamp(this.position.y, floor, this.isSurfacing ? Infinity : SURFACE_Y - 0.6);
	}

	private readonly onPointerMove = (event: PointerEvent): void => {
		this._pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
		this._pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
	};
}
