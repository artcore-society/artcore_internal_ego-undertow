import fishHeader from '../../../shaders/patches/fish.header.vertex.glsl';
import fishNormal from '../../../shaders/patches/fish.normal.vertex.glsl';
import fishVertex from '../../../shaders/patches/fish.vertex.glsl';
import swayHeader from '../../../shaders/patches/sway.header.vertex.glsl';
import swayVertex from '../../../shaders/patches/sway.vertex.glsl';
import pulseHeader from '../../../shaders/patches/pulse.header.vertex.glsl';
import pulseVertex from '../../../shaders/patches/pulse.vertex.glsl';
import undulateHeader from '../../../shaders/patches/undulate.header.vertex.glsl';
import undulateVertex from '../../../shaders/patches/undulate.vertex.glsl';
import flapHeader from '../../../shaders/patches/flap.header.vertex.glsl';
import flapVertex from '../../../shaders/patches/flap.vertex.glsl';
import type { IMaterialPatch } from '../../Helpers/MaterialPatch.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';

/** Vertex animation patches: all motion of plants and animals runs on the GPU. */
export default class LifePatches {
	public readonly fish: IMaterialPatch;
	public readonly pulse: IMaterialPatch;

	private readonly _water: WaterUniforms;

	constructor(water: WaterUniforms) {
		this._water = water;
		this.fish = {
			key: 'fish',
			uniforms: water.timeUniforms,
			vertexHeader: fishHeader,
			normalTransform: fishNormal,
			vertexTransform: fishVertex
		};
		this.pulse = {
			key: 'pulse',
			uniforms: water.timeUniforms,
			vertexHeader: pulseHeader,
			vertexTransform: pulseVertex
		};
	}

	/**
	 * @param amount metres the tip moves
	 * @param height model-space height of the plant (its tip sways the most)
	 */
	public sway(amount: number, height: number): IMaterialPatch {
		return {
			key: 'sway',
			uniforms: { ...this._water.timeUniforms, uSwayAmount: { value: amount }, uSwayHeight: { value: height } },
			vertexHeader: swayHeader,
			vertexTransform: swayVertex
		};
	}

	/** @param halfSpan model-space distance from the body to a wing tip */
	public flap(halfSpan: number): IMaterialPatch {
		return {
			key: 'flap',
			uniforms: { ...this._water.timeUniforms, uHalfSpan: { value: halfSpan } },
			vertexHeader: flapHeader,
			vertexTransform: flapVertex
		};
	}

	public undulate(length: number): IMaterialPatch {
		return {
			key: 'undulate',
			uniforms: { ...this._water.timeUniforms, uLength: { value: length } },
			vertexHeader: undulateHeader,
			vertexTransform: undulateVertex
		};
	}
}
