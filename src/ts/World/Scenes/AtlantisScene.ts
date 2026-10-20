import {
	Color,
	ConeGeometry,
	Euler,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	OctahedronGeometry,
	PointLight,
	Vector3,
	type BufferGeometry
} from 'three';
import cityHeader from '../../../shaders/patches/city.header.fragment.glsl';
import cityFragment from '../../../shaders/patches/city.fragment.glsl';
import DiveScene from './DiveScene.ts';
import ColumnCollider from '../Colliders/ColumnCollider.ts';
import SphereCollider from '../Colliders/SphereCollider.ts';
import JellyfishBloom from '../Life/JellyfishBloom.ts';
import { PropKind, type IPropPlacement } from '../Props/PropFactory.ts';
import { patchMaterial, type IMaterialPatch } from '../../Helpers/MaterialPatch.ts';
import { damp } from '../../Helpers/math.ts';
import { SCENES, canyonCentre, canyonWidthAt } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/**
 * VI. Atlantis: a drowned city in rings around a spire. Asleep until the diver returns Mara's light
 * to the heart crystal; then its windows wake in a wave spreading outwards.
 */
export default class AtlantisScene extends DiveScene {
	private static readonly SPIRE_HEIGHT = 38;
	private static readonly WAKE_SPEED = 16;
	private static readonly LIGHT_POWER = 2600;

	public readonly heart: Vector3;

	private readonly _city: IMaterialPatch;
	private readonly _litRadius = { value: 0 };
	private readonly _heartMaterial: MeshBasicMaterial;
	private readonly _light = new PointLight('#7ff6e8', 0, 160, 1.4);
	private readonly _owned: (BufferGeometry | MeshLambertMaterial | MeshBasicMaterial)[] = [];
	private _isAwake = false;
	private _heartGlow = 0;

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.ATLANTIS], context, 97);

		this._city = {
			key: 'city',
			uniforms: {
				uLitRadius: this._litRadius,
				uCityCentre: { value: this.centre.clone() },
				uWindowColor: { value: new Color('#7ff6e8') }
			},
			fragmentHeader: cityHeader,
			fragmentLight: cityFragment
		};

		const base = this.ground(this.centre.x, this.centre.z);
		this.heart = base.clone().setY(base.y + AtlantisScene.SPIRE_HEIGHT + 3);
		this._heartMaterial = new MeshBasicMaterial({ color: new Color('#7ff6e8') });

		this.buildSpire(base);
		this.buildCity();

		this._light.position.copy(this.heart);

		this.own(new JellyfishBloom(context.patches, this.drift(40), '#7ff6e8'));
		this.vent(this.ground(this.centre.x + 22, this.centre.z + 40), 14);
		this.vent(this.ground(this.centre.x - 10, this.centre.z + 95), 16);
	}

	/**
	 * The heart's light. It lives at the scene root, not in this (culled) group: a light that toggles
	 * visibility changes the light count and recompiles every lit shader.
	 */
	public get light(): PointLight {
		return this._light;
	}

	public get isAwake(): boolean {
		return this._isAwake;
	}

	public awaken(): void {
		this._isAwake = true;
	}

	public reset(): void {
		this._isAwake = false;
		this._litRadius.value = 0;
		this._heartGlow = 0;
	}

	public override update(frame: IFrameContext): void {
		if (this._isAwake) {
			this._litRadius.value = Math.min(400, this._litRadius.value + frame.delta * AtlantisScene.WAKE_SPEED);
		}

		this._heartGlow = damp(this._heartGlow, this._isAwake ? 1 : 0.08, 0.7, frame.delta);
		this._heartMaterial.color
			.setRGB(0.5, 0.96, 0.91)
			.multiplyScalar(0.4 + this._heartGlow * (5 + Math.sin(frame.elapsed * 2) * 1.2));
		this._light.intensity = this._heartGlow * AtlantisScene.LIGHT_POWER;
		this.updateVents(frame.elapsed);
	}

	public override dispose(): void {
		super.dispose();
		this._owned.forEach((item) => item.dispose());
		this._light.dispose();
	}

	private buildSpire(base: Vector3): void {
		const stone = patchMaterial(new MeshLambertMaterial({ color: '#6c7a80' }), this._city, this.context.water.caustics);
		const spire = new ConeGeometry(5, AtlantisScene.SPIRE_HEIGHT, 8, 4).translate(0, AtlantisScene.SPIRE_HEIGHT / 2, 0);
		const crystal = new OctahedronGeometry(2.4, 0).scale(1, 1.6, 1);
		this._owned.push(stone, spire, crystal, this._heartMaterial);

		const spireMesh = new Mesh(spire, stone);
		spireMesh.position.copy(base);
		const crystalMesh = new Mesh(crystal, this._heartMaterial);
		crystalMesh.position.copy(this.heart);
		this.add(spireMesh, crystalMesh);

		this.colliders.push(new ColumnCollider(base.x, base.z, 4.2, base.y, base.y + AtlantisScene.SPIRE_HEIGHT * 0.7));
	}

	private buildCity(): void {
		const { props } = this.context;
		const columns: IPropPlacement[] = [];
		const domes: IPropPlacement[] = [];
		const arches: IPropPlacement[] = [];
		const towers: IPropPlacement[] = [];
		const blocks: IPropPlacement[] = [];

		this.ring(12, 15, 0).forEach((position) => columns.push({ position, scale: new Vector3(1.4, 9, 1.4) }));

		this.ring(14, 34, 0.2).forEach((position) => {
			const size = this.random.range(4.5, 8);
			domes.push({ position, scale: size, color: '#7a8b90' });
			this.colliders.push(new SphereCollider(position, size * 0.95));
		});

		this.ring(8, 24, 0.4).forEach((position) => {
			arches.push({
				position,
				scale: 6,
				rotation: new Euler(0, Math.atan2(position.x - this.centre.x, position.z - this.centre.z) + Math.PI / 2, 0)
			});
		});

		this.belt(46, 50, 115).forEach((position) => {
			const radius = this.random.range(2, 4);
			const height = this.random.range(10, 30);
			towers.push({
				position,
				scale: new Vector3(radius, height, radius),
				color: this.random.next() > 0.5 ? '#6f7f86' : '#86908a'
			});
			this.colliders.push(new ColumnCollider(position.x, position.z, radius, position.y, position.y + height));
		});

		this.belt(150, 42, 160).forEach((position) => {
			const width = this.random.range(3, 7);
			blocks.push({
				position: position.setY(position.y + width * 0.25),
				scale: new Vector3(width, this.random.range(2.5, 6), this.random.range(3, 7)),
				rotation: new Euler(0, this.random.range(0, Math.PI), 0),
				color: this.random.next() > 0.5 ? '#77847f' : '#8b918a'
			});

			if (width > 4.5) {
				this.colliders.push(new SphereCollider(position, width * 0.6));
			}
		});

		this.add(
			props.instanced(PropKind.COLUMN, columns, '#8a9590', this._city),
			props.instanced(PropKind.DOME, domes, '#7a8b90', this._city),
			props.instanced(PropKind.ARCH, arches, '#8a9590', this._city),
			props.instanced(PropKind.TOWER, towers, '#6f7f86', this._city),
			props.instanced(PropKind.BLOCK, blocks, '#77847f', this._city)
		);
	}

	/** Evenly spaced points on a circle around the spire. */
	private ring(count: number, radius: number, offset: number): Vector3[] {
		return [...Array(count).keys()].map((index) => {
			const angle = ((index + offset) / count) * Math.PI * 2;

			return this.ground(this.centre.x + Math.cos(angle) * radius, this.centre.z + Math.sin(angle) * radius, -0.3);
		});
	}

	/** Random points in a ring band, inside the canyon. */
	private belt(count: number, inner: number, outer: number): Vector3[] {
		const points: Vector3[] = [];
		let attempts = 0;

		while (points.length < count && attempts < count * 20) {
			attempts++;

			const angle = this.random.range(0, Math.PI * 2);
			const radius = Math.sqrt(this.random.range(inner * inner, outer * outer));
			const x = this.centre.x + Math.cos(angle) * radius;
			const z = this.centre.z + Math.sin(angle) * radius;

			if (Math.abs(x - canyonCentre(z)) < canyonWidthAt(z) * 0.55) {
				points.push(this.ground(x, z, -0.3));
			}
		}

		return points;
	}

	private drift(count: number): Vector3[] {
		return [...Array(count).keys()].map(() =>
			this.centre
				.clone()
				.add(new Vector3(this.random.range(-90, 90), this.random.range(12, 50), this.random.range(-90, 90)))
		);
	}
}
