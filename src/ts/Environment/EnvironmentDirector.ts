import { DEPTH_STOPS, ILLUMINATED_STATE, SHELTER_LIGHT, type IDepthStop } from '../Config/environment.ts';
import { damp } from '../Helpers/math.ts';
import { createEnvironment, lerpEnvironment } from './environmentBlend.ts';
import type IEnvironmentAware from '../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../Contracts/IEnvironmentState.ts';

/**
 * The look of the water is a function of where you are: depth picks a blend of the depth stops,
 * shelter (inside a hull) dims the sun, and the story can illuminate the abyss. Pushed to every
 * IEnvironmentAware each frame; it is only a handful of numbers and colours.
 */
export default class EnvironmentDirector {
	private readonly _stops: readonly IDepthStop[];
	private readonly _subscribers: IEnvironmentAware[] = [];
	private readonly _depthState = createEnvironment();
	private readonly _state = createEnvironment();
	private _depth = 0;
	private _shelter = 0;
	private _illumination = 0;
	private _illuminationTarget = 0;

	constructor(stops: readonly IDepthStop[] = DEPTH_STOPS) {
		this._stops = stops;
	}

	public get state(): Readonly<IEnvironmentState> {
		return this._state;
	}

	/** 0 = sunlit, 1 = black: drives the head lamp's visible beam. */
	public get darkness(): number {
		return 1 - Math.min(1, (this._state.sunIntensity + this._state.ambientIntensity * 0.5) / 1.2);
	}

	public subscribe(...subscribers: IEnvironmentAware[]): void {
		this._subscribers.push(...subscribers);
	}

	public setIlluminated(enabled: boolean, instant = false): void {
		this._illuminationTarget = enabled ? 1 : 0;

		if (instant) {
			this._illumination = this._illuminationTarget;
		}
	}

	public update(depth: number, shelter: number, delta: number): void {
		this._depth = damp(this._depth, depth, 3, delta);
		this._shelter = damp(this._shelter, shelter, 2.5, delta);
		this._illumination = damp(this._illumination, this._illuminationTarget, 0.35, delta);

		this.sampleDepth(this._depth);
		lerpEnvironment(this._state, this._depthState, ILLUMINATED_STATE, this._illumination * this.abyssFactor());

		const light = 1 - this._shelter * (1 - SHELTER_LIGHT);
		this._state.sunIntensity *= light;
		this._state.caustics *= light;
		this._state.godRays *= light;
		this._state.ambientIntensity *= 0.55 + light * 0.45;

		this._subscribers.forEach((subscriber) => subscriber.applyEnvironment(this._state));
	}

	/** Illumination belongs to the abyss; it fades out if you swim back up. */
	private abyssFactor(): number {
		return Math.min(1, Math.max(0, (this._depth - 120) / 40));
	}

	private sampleDepth(depth: number): void {
		const first = this._stops[0];
		const last = this._stops[this._stops.length - 1];

		if (!first || !last) {
			return;
		}

		if (depth <= first.depth) {
			lerpEnvironment(this._depthState, first.state, first.state, 0);

			return;
		}

		for (let i = 1; i < this._stops.length; i++) {
			const upper = this._stops[i - 1];
			const lower = this._stops[i];

			if (upper && lower && depth <= lower.depth) {
				lerpEnvironment(
					this._depthState,
					upper.state,
					lower.state,
					(depth - upper.depth) / (lower.depth - upper.depth)
				);

				return;
			}
		}

		lerpEnvironment(this._depthState, last.state, last.state, 0);
	}
}
