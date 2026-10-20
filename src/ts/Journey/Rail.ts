import { CatmullRomCurve3, Vector3 } from 'three';
import type { IShot } from './IJourney.ts';

export interface IRailSample {
	readonly position: Vector3;
	readonly target: Vector3;
}

/**
 * The camera's path: a smooth curve through the shots' positions and another through their look
 * targets. Progress maps to the curves piecewise, so each shot lands exactly at its own progress.
 */
export default class Rail {
	private readonly _shots: readonly IShot[];
	private readonly _positions: CatmullRomCurve3;
	private readonly _targets: CatmullRomCurve3;
	private readonly _sample = { position: new Vector3(), target: new Vector3() };

	constructor(shots: readonly IShot[]) {
		this._shots = shots;
		this._positions = new CatmullRomCurve3(
			shots.map((shot) => shot.position),
			false,
			'centripetal'
		);
		this._targets = new CatmullRomCurve3(
			shots.map((shot) => shot.target),
			false,
			'centripetal'
		);
	}

	public sample(progress: number): IRailSample {
		const t = this.curveParameter(progress);

		this._positions.getPoint(t, this._sample.position);
		this._targets.getPoint(t, this._sample.target);

		return this._sample;
	}

	/** Points spaced along the camera path, e.g. to lay a trail of light along it. */
	public spacedPoints(count: number): Vector3[] {
		return this._positions.getSpacedPoints(count);
	}

	private curveParameter(progress: number): number {
		const segments = this._shots.length - 1;

		for (let i = 0; i < segments; i++) {
			const from = this._shots[i];
			const to = this._shots[i + 1];

			if (from && to && progress <= to.progress) {
				const local = (progress - from.progress) / Math.max(1e-6, to.progress - from.progress);

				return (i + Math.min(1, Math.max(0, local))) / segments;
			}
		}

		return 1;
	}
}
