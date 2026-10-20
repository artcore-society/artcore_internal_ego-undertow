import { Color } from 'three';
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

	/** Patch for lit materials: adds caustics, fading with depth and on surfaces that don't face up. */
	public readonly caustics: IMaterialPatch = {
		key: 'caustics',
		uniforms: {
			uTime: this.time,
			uCausticStrength: this.causticStrength,
			uCausticTint: this.causticTint,
			uSurfaceY: this.surfaceY
		},
		vertexHeader: causticsVertexHeader,
		vertexPost: causticsVertex,
		fragmentHeader: causticsHeader,
		fragmentLight: causticsFragment
	};

	/** Shared time uniform for animated vertex patches (sway, swim, pulse). */
	public readonly timeUniforms = { uTime: this.time };

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this.causticStrength.value = state.caustics;
		this.fogDensity.value = state.fogDensity;
	}

	public update(elapsed: number): void {
		this.time.value = elapsed;
	}
}
