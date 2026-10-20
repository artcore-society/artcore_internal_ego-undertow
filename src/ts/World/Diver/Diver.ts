import { Group, Vector3 } from 'three';
import DiverModel from './DiverModel.ts';
import DiverPhysics from './DiverPhysics.ts';
import Flashlight from './Flashlight.ts';
import type DiverController from './DiverController.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDiverState from '../../Contracts/IDiverState.ts';
import type ICollider from '../../Contracts/ICollider.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type ITerrainSampler from '../../Contracts/ITerrainSampler.ts';

type BreathListener = (regulator: Vector3) => void;

/** The player: physics, model, head lamp and breathing rhythm, behind one IDiverState facade. */
export default class Diver implements IDiverState, IDisposable {
	private static readonly BREATH_SECONDS = 4.6;

	public readonly root = new Group();
	public readonly flashlight = new Flashlight();

	private readonly _physics: DiverPhysics;
	private readonly _model: DiverModel;
	private readonly _controller: DiverController;
	private readonly _regulator = new Vector3();
	private _breath = 0;
	private _breathRate = 1;
	private _onExhale: BreathListener | null = null;
	private _onInhale: (() => void) | null = null;

	constructor(
		water: WaterUniforms,
		terrain: ITerrainSampler,
		colliders: readonly ICollider[],
		controller: DiverController
	) {
		this._physics = new DiverPhysics(terrain, colliders);
		this._model = new DiverModel(water);
		this._controller = controller;

		this.flashlight.position.copy(this._model.lampMount);
		this.root.add(this._model, this.flashlight);
	}

	public get position(): Vector3 {
		return this._physics.position;
	}

	public get velocity(): Vector3 {
		return this._physics.velocity;
	}

	public get yaw(): number {
		return this._physics.yaw;
	}

	public get depth(): number {
		return this._physics.depth;
	}

	public get speed(): number {
		return this._physics.speed;
	}

	public get speedRatio(): number {
		return this._physics.speedRatio;
	}

	public get isSprinting(): boolean {
		return this._physics.isSprinting;
	}

	/** Breaths per cycle multiplier: faster when sprinting or low on air. */
	public set breathRate(value: number) {
		this._breathRate = value;
	}

	public onExhale(listener: BreathListener): void {
		this._onExhale = listener;
	}

	public onInhale(listener: () => void): void {
		this._onInhale = listener;
	}

	public teleport(x: number, y: number, z: number, yaw: number): void {
		this._physics.teleport(x, y, z, yaw);
		this.syncRoot();
	}

	public update(elapsed: number, delta: number, darkness: number): void {
		this._physics.step(this._controller, delta);
		this.syncRoot();

		const effort = Math.max(Math.abs(this._controller.forward), Math.abs(this._controller.vertical) * 0.7);
		const pitch = -this._physics.velocity.y * 0.09;

		this._model.animate(effort * (this.isSprinting ? 1 : 0.6), -this._physics.turnRate * 0.25, pitch, elapsed, delta);
		this.flashlight.rotation.x = pitch;
		this.flashlight.update(darkness, delta);
		this.breathe(delta);
	}

	public dispose(): void {
		this._model.dispose();
		this.flashlight.dispose();
	}

	private syncRoot(): void {
		this.root.position.copy(this._physics.position);
		this.root.rotation.y = this._physics.yaw;
	}

	/** Inhale at the start of each cycle, exhale bubbles at the middle. */
	private breathe(delta: number): void {
		const previous = this._breath;
		this._breath = (this._breath + (delta * this._breathRate) / Diver.BREATH_SECONDS) % 1;

		if (this._breath < previous) {
			this._onInhale?.();
		}

		if (previous < 0.5 && this._breath >= 0.5) {
			this._regulator.copy(this._model.regulator).applyMatrix4(this._model.matrixWorld);
			this._onExhale?.(this._regulator);
		}
	}
}
