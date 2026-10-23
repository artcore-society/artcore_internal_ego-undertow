import { Group, Object3D, SpotLight } from 'three';
import { damp } from '../Helpers/math.ts';
import type IDisposable from '../Contracts/IDisposable.ts';

/**
 * The diver's head lamp, mounted on the camera. It switches itself on as the water gets dark, and
 * turns a little towards where the pointer is: you light up what you look at.
 * The light is never removed or hidden (that would change the light count and recompile every lit
 * shader); it only fades its intensity.
 */
export default class HeadLamp extends Group implements IDisposable {
	private static readonly RANGE = 48;
	private static readonly POWER = 110;
	/** Darkness (0..1) from which the lamp starts to come on. */
	private static readonly THRESHOLD = 0.2;

	private readonly _light = new SpotLight('#eafcff', 0, HeadLamp.RANGE, 0.5, 0.7, 1.6);
	private readonly _target = new Object3D();
	private _level = 0;
	private readonly _aim = { x: 0, y: 0 };

	/** 0..1 an extra flash of the lamp (signalling). */
	public flash = 0;

	constructor() {
		super();

		// Slightly below and right of the eyes, aimed forward and a touch down
		this._light.position.set(0.25, -0.2, 0);
		this._target.position.set(0, -1.2, -10);
		this._light.target = this._target;
		this.add(this._light, this._target);
	}

	/** 0..1 how strongly the lamp is on, e.g. for the beam in the lens pass. */
	public get level(): number {
		return this._level;
	}

	/** Where the beam points, -1..1 across and down the screen (eased towards the pointer). */
	public get aim(): Readonly<{ x: number; y: number }> {
		return this._aim;
	}

	/**
	 * @param darkness 0 = sunlit, 1 = black
	 * @param pointer -1..1 across and down the screen
	 */
	public update(darkness: number, pointer: Readonly<{ x: number; y: number }>, delta: number): void {
		const goal = Math.min(1, Math.max(0, (darkness - HeadLamp.THRESHOLD) / (1 - HeadLamp.THRESHOLD)));

		this._level = damp(this._level, goal, 1.5, delta);
		this._light.intensity = this._level * HeadLamp.POWER * (1 + this.flash * 1.6);

		// A head turning, not a laser: it follows the pointer slowly and only part of the way
		this._aim.x = damp(this._aim.x, pointer.x * 0.6, 2.5, delta);
		this._aim.y = damp(this._aim.y, pointer.y * 0.5, 2.5, delta);
		this._target.position.set(this._aim.x * 6, -1.2 - this._aim.y * 4.5, -10);
	}

	public override dispose(): void {
		this._light.dispose();
		super.dispose();
	}
}
