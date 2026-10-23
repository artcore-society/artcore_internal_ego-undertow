import { Color, Vector2, Vector3 } from 'three';
import causticsVertexHeader from '../../../shaders/patches/caustics.header.vertex.glsl';
import causticsVertex from '../../../shaders/patches/caustics.vertex.glsl';
import causticsHeader from '../../../shaders/patches/caustics.header.fragment.glsl';
import causticsFragment from '../../../shaders/patches/caustics.fragment.glsl';
import { SURFACE_Y } from '../../Config/world.ts';
import type { IMaterialPatch } from '../../Helpers/MaterialPatch.ts';
import type IEnvironmentAware from '../../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../../Contracts/IEnvironmentState.ts';

/**
 * Uniforms every underwater material shares: time and the caustic light dancing on everything that faces up.
 * One object, many materials: updating it once per frame reaches them all.
 */
export default class WaterUniforms implements IEnvironmentAware {
	public readonly time = { value: 0 };
	public readonly causticStrength = { value: 1 };
	public readonly causticTint = { value: new Color('#bff6ff') };
	public readonly surfaceY = { value: SURFACE_Y };
	/** Murk density, for custom shaders that fade with distance themselves. */
	public readonly fogDensity = { value: 0.03 };
	/**
	 * The current, metres per second across the water (x, z): one slow, wandering drift that plants lean
	 * into, specks ride and the diver sways with.
	 */
	public readonly current = { value: new Vector2() };
	/** Where the current has carried the water so far (x, 0, z): drifting things add it to their position. */
	public readonly carried = { value: new Vector3() };
	/** The sonar's ring: where it was sent from, and how far it has swept (negative: none). */
	public readonly pingOrigin = { value: new Vector3() };
	public readonly pingRadius = { value: -1 };

	/** Patch for lit materials: adds caustics, fading with depth and on surfaces that don't face up. */
	public readonly caustics: IMaterialPatch = {
		key: 'caustics',
		uniforms: {
			uTime: this.time,
			uCausticStrength: this.causticStrength,
			uCausticTint: this.causticTint,
			uSurfaceY: this.surfaceY,
			uPingOrigin: this.pingOrigin,
			uPingRadius: this.pingRadius
		},
		vertexHeader: causticsVertexHeader,
		vertexPost: causticsVertex,
		fragmentHeader: causticsHeader,
		fragmentLight: causticsFragment
	};

	/** Shared time (and current) uniforms for animated vertex patches (sway, swim, pulse). */
	public readonly timeUniforms = { uTime: this.time, uCurrent: this.current };

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this.causticStrength.value = state.caustics;
		this.fogDensity.value = state.fogDensity;
	}

	public update(elapsed: number, delta: number): void {
		this.time.value = elapsed;

		// Turns slowly over minutes and surges every few seconds
		const heading = elapsed * 0.015;
		const strength = 0.22 + Math.sin(elapsed * 0.31) * 0.08 + Math.sin(elapsed * 0.13) * 0.05;
		this.current.value.set(Math.cos(heading) * strength, Math.sin(heading) * strength);
		this.carried.value.x += this.current.value.x * delta;
		this.carried.value.z += this.current.value.y * delta;
	}
}
