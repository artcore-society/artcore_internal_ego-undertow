import { Group, Plane, Vector3, type Material, type MeshStandardMaterial, type Object3D } from 'three';
import { SURFACE_Y } from '../../Config/world.ts';
import type OpenSea from './OpenSea.ts';

/**
 * Kai's boat, waiting at the surface where the diver comes up at the end: an old trawler (model authored
 * 13 m long, waterline at y = 0, bow towards -Z), riding the same swell as the sea, its lights on. From
 * below the surface only its hull shows: everything above the water is clipped away.
 */
export default class CrewBoat extends Group {
	/** Half its length and beam: where the swell is sampled to pitch and roll it. */
	private static readonly HALF_LENGTH = 6;
	private static readonly HALF_BEAM = 1.5;
	/** How bright the windows and deck lights burn at dusk. */
	private static readonly LIGHTS = 2.5;
	/** A plane this high clips nothing: kept in place so the shader never recompiles when it's switched. */
	private static readonly UNCLIPPED = 1e6;

	private readonly _sea: OpenSea;
	private readonly _forward = new Vector3(0, 0, -1);
	private readonly _side = new Vector3(1, 0, 0);
	private _heading = 0;
	/** Keeps what's below the surface (normal down); moved far up when nothing should be cut. */
	private readonly _waterline = new Plane(new Vector3(0, -1, 0), CrewBoat.UNCLIPPED);

	constructor(model: Object3D, materials: readonly Material[], sea: OpenSea) {
		super();

		this._sea = sea;
		materials.forEach((material) => {
			(material as MeshStandardMaterial).emissiveIntensity = CrewBoat.LIGHTS;
			material.clippingPlanes = [this._waterline];
		});
		this.add(model);
	}

	/** Seen from under the water: only the hull below the surface is drawn. */
	public set isSeenFromBelow(value: boolean) {
		this._waterline.constant = value ? SURFACE_Y : CrewBoat.UNCLIPPED;
	}

	/** Moors it at (x, z), its bow pointing along `heading` (level). */
	public moor(x: number, z: number, heading: Readonly<Vector3>): void {
		this._heading = Math.atan2(-heading.x, -heading.z);
		this._forward.set(heading.x, 0, heading.z).normalize();
		this._side.set(-this._forward.z, 0, this._forward.x);
		this.position.set(x, 0, z);
	}

	/** Rides the swell: lifted by the water under it, pitched and rolled by the waves along its length and beam. */
	public update(): void {
		const { x, z } = this.position;
		const { HALF_LENGTH: length, HALF_BEAM: beam } = CrewBoat;
		const bow = this._sea.heightAt(x + this._forward.x * length, z + this._forward.z * length);
		const stern = this._sea.heightAt(x - this._forward.x * length, z - this._forward.z * length);
		const port = this._sea.heightAt(x - this._side.x * beam, z - this._side.z * beam);
		const starboard = this._sea.heightAt(x + this._side.x * beam, z + this._side.z * beam);

		this.position.y = (bow + stern + port + starboard) / 4;
		// A heavy hull: it follows the swell's slope, but only part of the way
		this.rotation.set(
			Math.atan2(bow - stern, length * 2) * 0.7,
			this._heading,
			Math.atan2(port - starboard, beam * 2) * 0.5,
			'YXZ'
		);
	}
}
