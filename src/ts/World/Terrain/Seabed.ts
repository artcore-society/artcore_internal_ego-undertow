import { BufferAttribute, Color, Mesh, MeshStandardMaterial, PlaneGeometry, Vector2 } from 'three';
import seabedVertexHeader from '../../../shaders/patches/seabed.header.vertex.glsl';
import seabedVertex from '../../../shaders/patches/seabed.vertex.glsl';
import seabedFragmentHeader from '../../../shaders/patches/seabed.header.fragment.glsl';
import seabedFragment from '../../../shaders/patches/seabed.fragment.glsl';
import { SCENES, SURFACE_Y, WORLD_BOUNDS, canyonCentre, canyonWidthAt, floorAt } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import { fbm, smoothstep } from '../../Helpers/noise.ts';
import { patchMaterial, type IMaterialPatch } from '../../Helpers/MaterialPatch.ts';
import type AssetLibrary from '../../Assets/AssetLibrary.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type ITerrainSampler from '../../Contracts/ITerrainSampler.ts';

/**
 * The canyon floor: one heightfield, sand-textured, with triplanar rock on its walls and coral rubble
 * in the shallows. heightAt() is the same function the mesh is built from, so props sit exactly on it.
 */
export default class Seabed extends Mesh<PlaneGeometry, MeshStandardMaterial> implements ITerrainSampler, IDisposable {
	private static readonly PADDING = 60;
	private static readonly CELL = 3;
	/** Metres per texture repeat. */
	private static readonly TILE = 6;

	private static readonly SHALLOW = new Color('#fff4e2');
	private static readonly DEEP = new Color('#7d8f99');

	constructor(water: WaterUniforms, assets: AssetLibrary) {
		const width = WORLD_BOUNDS.maxX - WORLD_BOUNDS.minX + Seabed.PADDING * 2;
		const length = WORLD_BOUNDS.maxZ - WORLD_BOUNDS.minZ + Seabed.PADDING * 2;
		const geometry = new PlaneGeometry(
			width,
			length,
			Math.round(width / Seabed.CELL),
			Math.round(length / Seabed.CELL)
		);
		geometry.rotateX(-Math.PI / 2);
		geometry.translate((WORLD_BOUNDS.minX + WORLD_BOUNDS.maxX) / 2, 0, (WORLD_BOUNDS.minZ + WORLD_BOUNDS.maxZ) / 2);

		const patch: IMaterialPatch = {
			key: 'seabed',
			uniforms: {
				uRockMap: { value: assets.texture('rock_face', 'diffuse') },
				uRubbleMap: { value: assets.texture('coral_ground_02', 'diffuse') },
				uRubbleZ: { value: SCENES[SceneId.REEF].z + 40 }
			},
			vertexHeader: seabedVertexHeader,
			vertexPost: seabedVertex,
			fragmentHeader: seabedFragmentHeader,
			fragmentColor: seabedFragment
		};

		const material = new MeshStandardMaterial({
			map: assets.texture('coast_sand_01', 'diffuse'),
			normalMap: assets.texture('coast_sand_01', 'nor_gl'),
			normalScale: new Vector2(1.4, 1.4),
			roughnessMap: assets.texture('coast_sand_01', 'rough'),
			vertexColors: true,
			metalness: 0
		});

		// Caustics first: the seabed patch reads its world-position varying
		super(geometry, patchMaterial(material, water.caustics, patch));

		this.name = 'Seabed';
		this.shape();
		this.matrixAutoUpdate = false;
		this.updateMatrix();
	}

	public heightAt(x: number, z: number): number {
		const floor = floorAt(z);
		const offset = Math.abs(x - canyonCentre(z));
		const width = canyonWidthAt(z);
		const wallT = smoothstep(width * 0.45, width, offset);
		const wallHeight = 34 + Math.max(0, -floor) * 0.45;
		const dunes = fbm(x * 0.018, z * 0.018) * 2.4 + fbm(x * 0.09 + 13, z * 0.09) * 0.35;
		const ridges = wallT * fbm(x * 0.045 + 7, z * 0.045 - 3, 4) * 16;

		// Walls stay well under the surface with a ragged crest, so they melt into the murk instead of
		// showing a flat top against the bright water above
		const crest = SURFACE_Y - 11 + fbm(x * 0.03 - 5, z * 0.03 + 9) * 4;
		const height = floor + wallT * wallT * wallHeight + dunes + ridges;

		return height > crest ? crest + (height - crest) * 0.15 : height;
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}

	private shape(): void {
		const position = this.geometry.getAttribute('position');
		const uv = this.geometry.getAttribute('uv');

		for (let i = 0; i < position.count; i++) {
			const x = position.getX(i);
			const z = position.getZ(i);
			position.setY(i, this.heightAt(x, z));
			uv.setXY(i, x / Seabed.TILE, z / Seabed.TILE);
		}

		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		this.paint();
	}

	/** Per-vertex tint (sunlit sand → deep silt) and how much rock shows (steepness). */
	private paint(): void {
		const position = this.geometry.getAttribute('position');
		const normal = this.geometry.getAttribute('normal');
		const colors = new Float32Array(position.count * 3);
		const rock = new Float32Array(position.count);
		const color = new Color();

		for (let i = 0; i < position.count; i++) {
			const depthT = Math.min(1, -position.getY(i) / 180);
			const steep = smoothstep(0.9, 0.62, normal.getY(i));
			const outcrop = smoothstep(0.35, 0.7, fbm(position.getX(i) * 0.03 + 40, position.getZ(i) * 0.03, 2) * 0.5 + 0.5);

			color.copy(Seabed.SHALLOW).lerp(Seabed.DEEP, depthT);
			color.toArray(colors, i * 3);
			rock[i] = Math.max(steep, outcrop * 0.6);
		}

		this.geometry.setAttribute('color', new BufferAttribute(colors, 3));
		this.geometry.setAttribute('aRock', new BufferAttribute(rock, 1));
	}
}
