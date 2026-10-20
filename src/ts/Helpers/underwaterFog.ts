import { ShaderChunk } from 'three';
import fogParsVertex from '../../shaders/fog/fog_pars_vertex.glsl';
import fogVertex from '../../shaders/fog/fog_vertex.glsl';
import fogParsFragment from '../../shaders/fog/fog_pars_fragment.glsl';
import fogFragment from '../../shaders/fog/fog_fragment.glsl';

let isInstalled = false;

/**
 * Replaces three.js' fog with underwater fog for every built-in material: brighter when looking up,
 * darker when looking down, and red absorbed first. Must run before the first shader compiles.
 */
export function installUnderwaterFog(): void {
	if (isInstalled) {
		return;
	}

	ShaderChunk.fog_pars_vertex = fogParsVertex;
	ShaderChunk.fog_vertex = fogVertex;
	ShaderChunk.fog_pars_fragment = fogParsFragment;
	ShaderChunk.fog_fragment = fogFragment;
	isInstalled = true;
}
