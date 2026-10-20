import triplanarVertexHeader from '../../../shaders/patches/triplanar.header.vertex.glsl';
import triplanarVertex from '../../../shaders/patches/triplanar.vertex.glsl';
import triplanarFragmentHeader from '../../../shaders/patches/triplanar.header.fragment.glsl';
import triplanarFragment from '../../../shaders/patches/triplanar.fragment.glsl';
import type { Texture } from 'three';
import type { IMaterialPatch } from '../../Helpers/MaterialPatch.ts';

/**
 * World-projected texture for geometry without good UVs (merged blocks, instanced buildings).
 * Needs the caustics patch on the same material: it reads its world-position varying.
 * @param scale texture repeats per metre
 */
export function triplanar(map: Texture, scale: number): IMaterialPatch {
	return {
		key: 'triplanar',
		uniforms: { uTriplanarMap: { value: map }, uTriplanarScale: { value: scale } },
		vertexHeader: triplanarVertexHeader,
		vertexPost: triplanarVertex,
		fragmentHeader: triplanarFragmentHeader,
		fragmentColor: triplanarFragment
	};
}
