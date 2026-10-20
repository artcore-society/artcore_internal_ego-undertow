import type { IUniform, Material, WebGLProgramParametersWithUniforms } from 'three';

/** A reusable piece of shader code injected into a built-in material. */
export interface IMaterialPatch {
	readonly key: string;
	readonly uniforms?: Readonly<Record<string, IUniform>>;
	readonly vertexHeader?: string;
	/** After `begin_vertex`: may change `transformed`. */
	readonly vertexTransform?: string;
	/** After `beginnormal_vertex`: may change `objectNormal`. */
	readonly normalTransform?: string;
	/** After `project_vertex`: `transformed`, `transformedNormal` and `mvPosition` are known. */
	readonly vertexPost?: string;
	readonly fragmentHeader?: string;
	/** After `color_fragment`: may change `diffuseColor` (albedo, after map and vertex colours). */
	readonly fragmentColor?: string;
	/** Before `opaque_fragment`: may change `outgoingLight` and `diffuseColor`. */
	readonly fragmentLight?: string;
}

function inject(source: string, chunk: string, code: string | undefined): string {
	return code ? source.replace(`#include <${chunk}>`, `#include <${chunk}>\n${code}`) : source;
}

function injectBefore(source: string, chunk: string, code: string | undefined): string {
	return code ? source.replace(`#include <${chunk}>`, `${code}\n#include <${chunk}>`) : source;
}

function join(patches: readonly IMaterialPatch[], pick: (patch: IMaterialPatch) => string | undefined): string {
	return patches
		.map(pick)
		.filter((code): code is string => Boolean(code))
		.join('\n');
}

/**
 * Extends a built-in three.js material with extra shader code, keeping its lighting, fog and instancing.
 * Patches with uniforms share the uniform objects, so one update reaches every patched material.
 */
export function patchMaterial<TMaterial extends Material>(
	material: TMaterial,
	...patches: IMaterialPatch[]
): TMaterial {
	const cacheKey = patches.map((patch) => patch.key).join('|');

	material.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms): void => {
		for (const patch of patches) {
			Object.assign(shader.uniforms, patch.uniforms);
		}

		let vertex = `${join(patches, (patch) => patch.vertexHeader)}\n${shader.vertexShader}`;
		vertex = inject(
			vertex,
			'begin_vertex',
			join(patches, (patch) => patch.vertexTransform)
		);
		vertex = inject(
			vertex,
			'beginnormal_vertex',
			join(patches, (patch) => patch.normalTransform)
		);
		vertex = inject(
			vertex,
			'project_vertex',
			join(patches, (patch) => patch.vertexPost)
		);

		let fragment = `${join(patches, (patch) => patch.fragmentHeader)}\n${shader.fragmentShader}`;
		fragment = injectBefore(
			fragment,
			'opaque_fragment',
			join(patches, (patch) => patch.fragmentLight)
		);

		shader.vertexShader = vertex;
		shader.fragmentShader = fragment;
	};

	material.customProgramCacheKey = (): string => cacheKey;

	return material;
}
