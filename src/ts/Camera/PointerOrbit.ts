import { MathUtils } from 'three';
import { damp } from '../Helpers/math.ts';
import type IDisposable from '../Contracts/IDisposable.ts';

/** Drag to look around (mouse or touch); springs back to centre once released. */
export default class PointerOrbit implements IDisposable {
	public yaw = 0;
	public pitch = 0;

	private readonly _element: HTMLElement;
	private _isDragging = false;
	private _targetYaw = 0;
	private _targetPitch = 0;

	constructor(element: HTMLElement) {
		this._element = element;
		element.addEventListener('pointerdown', this.onPointerDown);
		window.addEventListener('pointermove', this.onPointerMove);
		window.addEventListener('pointerup', this.onPointerUp);
	}

	public update(delta: number): void {
		if (!this._isDragging) {
			this._targetYaw = damp(this._targetYaw, 0, 0.8, delta);
			this._targetPitch = damp(this._targetPitch, 0, 0.8, delta);
		}

		this.yaw = damp(this.yaw, this._targetYaw, 10, delta);
		this.pitch = damp(this.pitch, this._targetPitch, 10, delta);
	}

	public dispose(): void {
		this._element.removeEventListener('pointerdown', this.onPointerDown);
		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('pointerup', this.onPointerUp);
	}

	private readonly onPointerDown = (): void => {
		this._isDragging = true;
	};

	private readonly onPointerMove = (event: PointerEvent): void => {
		if (!this._isDragging) {
			return;
		}

		this._targetYaw -= event.movementX * 0.006;
		this._targetPitch = MathUtils.clamp(this._targetPitch + event.movementY * 0.004, -0.9, 0.9);
	};

	private readonly onPointerUp = (): void => {
		this._isDragging = false;
	};
}
