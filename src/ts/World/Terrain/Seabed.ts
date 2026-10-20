import { BufferAttribute, Color, Mesh, MeshLambertMaterial, PlaneGeometry } from 'three';
import { SURFACE_Y, WORLD_BOUNDS, canyonCentre, canyonWidthAt, floorAt } from '../../Config/world.ts';
import { fbm, smoothstep } from '../../Helpers/noise.ts';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';
import type ITerrainSampler from '../../Contracts/ITerrainSampler.ts';

/**
 * The canyon floor: one heightfield the diver collides with exactly where it is drawn,
 * because the mesh and heightAt() share the same function.
 */
export default class Seabed extends Mesh<PlaneGeometry, MeshLambertMaterial> implements ITerrainSampler, IDisposable {
	private static readonly PADDING = 60;
	private static readonly CELL = 3.6;

	private static readonly SAND = new Color('#d8c49a');
	private static readonly SILT = new Color('#3d4c58');
	private static readonly ROCK = new Color('#5f6763');
	private static readonly DEEP_ROCK = new Color('#1f2a33');

	constructor(water: WaterUniforms) {
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

		super(geometry, patchMaterial(new MeshLambertMaterial({ vertexColors: true }), water.caustics));

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
		const ripples = fbm(x * 0.022, z * 0.022) * 2.6 + fbm(x * 0.11 + 13, z * 0.11) * 0.45;
		const ridges = wallT * fbm(x * 0.045 + 7, z * 0.045 - 3, 4) * 16;

		return Math.min(SURFACE_Y - 3, floor + wallT * wallT * wallHeight + ripples + ridges);
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}

	private shape(): void {
		const position = this.geometry.getAttribute('position');

		for (let i = 0; i < position.count; i++) {
			position.setY(i, this.heightAt(position.getX(i), position.getZ(i)));
		}

		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		this.paint();
	}

	/** Sand in the shallows, silt in the deep, rock wherever it is steep. */
	private paint(): void {
		const position = this.geometry.getAttribute('position');
		const normal = this.geometry.getAttribute('normal');
		const colors = new Float32Array(position.count * 3);
		const sand = new Color();
		const rock = new Color();
		const color = new Color();

		for (let i = 0; i < position.count; i++) {
			const depthT = Math.min(1, -position.getY(i) / 170);
			const slope = smoothstep(0.88, 0.6, normal.getY(i));
			const grain = fbm(position.getX(i) * 0.3, position.getZ(i) * 0.3, 2) * 0.06;

			sand.copy(Seabed.SAND).lerp(Seabed.SILT, depthT);
			rock.copy(Seabed.ROCK).lerp(Seabed.DEEP_ROCK, depthT);
			color.copy(sand).lerp(rock, slope).offsetHSL(0, 0, grain);
			color.toArray(colors, i * 3);
		}

		this.geometry.setAttribute('color', new BufferAttribute(colors, 3));
	}
}
