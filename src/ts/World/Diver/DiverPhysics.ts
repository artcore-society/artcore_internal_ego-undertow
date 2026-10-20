import { MathUtils, Vector3 } from 'three';
import { DIVER_CONFIG } from '../../Config/dive.ts';
import { SURFACE_Y, WORLD_BOUNDS } from '../../Config/world.ts';
import { damp, dampVector3 } from '../../Helpers/math.ts';
import type IDiverIntent from './IDiverIntent.ts';
import type IDiverState from '../../Contracts/IDiverState.ts';
import type ICollider from '../../Contracts/ICollider.ts';
import type ITerrainSampler from '../../Contracts/ITerrainSampler.ts';

/** Neutral-buoyancy swimming: heading-relative thrust, soft acceleration, seabed and prop collisions. */
export default class DiverPhysics implements IDiverState {
	public readonly position = new Vector3();
	public readonly velocity = new Vector3();

	private readonly _terrain: ITerrainSampler;
	private readonly _colliders: readonly ICollider[];
	private readonly _desired = new Vector3();
	private _yaw = 0;
	private _turnRate = 0;
	private _isSprinting = false;

	constructor(terrain: ITerrainSampler, colliders: readonly ICollider[]) {
		this._terrain = terrain;
		this._colliders = colliders;
	}

	public get yaw(): number {
		return this._yaw;
	}

	/** Smoothed turn rate, used to bank the model. */
	public get turnRate(): number {
		return this._turnRate;
	}

	public get depth(): number {
		return SURFACE_Y - this.position.y;
	}

	public get speed(): number {
		return this.velocity.length();
	}

	public get speedRatio(): number {
		return Math.min(1, this.speed / DIVER_CONFIG.sprintSpeed);
	}

	public get isSprinting(): boolean {
		return this._isSprinting;
	}

	public teleport(x: number, y: number, z: number, yaw: number): void {
		this.position.set(x, y, z);
		this.velocity.set(0, 0, 0);
		this._yaw = yaw;
		this._turnRate = 0;
	}

	public step(intent: IDiverIntent, delta: number): void {
		this._turnRate = damp(this._turnRate, intent.turn * DIVER_CONFIG.turnRate, 6, delta);
		this._yaw += this._turnRate * delta;
		this._isSprinting = intent.sprint;

		const speed = intent.forward * (intent.sprint ? DIVER_CONFIG.sprintSpeed : DIVER_CONFIG.cruiseSpeed);
		this._desired.set(
			-Math.sin(this._yaw) * speed,
			intent.vertical * DIVER_CONFIG.verticalSpeed,
			-Math.cos(this._yaw) * speed
		);

		const lambda = intent.forward !== 0 || intent.vertical !== 0 ? DIVER_CONFIG.acceleration : DIVER_CONFIG.drag;
		dampVector3(this.velocity, this._desired, lambda, delta);
		this.position.addScaledVector(this.velocity, delta);

		this.constrain();
	}

	private constrain(): void {
		const ceiling = SURFACE_Y - DIVER_CONFIG.surfaceMargin;

		if (this.position.y > ceiling) {
			this.position.y = ceiling;
			this.velocity.y = Math.min(0, this.velocity.y);
		}

		for (const collider of this._colliders) {
			collider.resolve(this.position, DIVER_CONFIG.radius);
		}

		const floor = this._terrain.heightAt(this.position.x, this.position.z) + DIVER_CONFIG.floorMargin;

		if (this.position.y < floor) {
			this.position.y = floor;
			this.velocity.y = Math.max(0, this.velocity.y);
		}

		this.position.x = MathUtils.clamp(this.position.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
		this.position.z = MathUtils.clamp(this.position.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ);
	}
}
