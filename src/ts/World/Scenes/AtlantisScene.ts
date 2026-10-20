import {
	AdditiveBlending,
	Color,
	CylinderGeometry,
	Euler,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	OctahedronGeometry,
	PointLight,
	RingGeometry,
	ShaderMaterial,
	TorusGeometry,
	Vector3,
	type BufferGeometry,
	type Material
} from 'three';
import cityHeader from '../../../shaders/patches/city.header.fragment.glsl';
import cityFragment from '../../../shaders/patches/city.fragment.glsl';
import pillarVertex from '../../../shaders/effects/pillar.vertex.glsl';
import pillarFragment from '../../../shaders/effects/pillar.fragment.glsl';
import DiveScene from './DiveScene.ts';
import JellyfishBloom from '../Life/JellyfishBloom.ts';
import { PropKind, type IPropPlacement } from '../Props/PropFactory.ts';
import { triplanar } from '../Materials/triplanar.ts';
import { patchMaterial, type IMaterialPatch } from '../../Helpers/MaterialPatch.ts';
import { damp } from '../../Helpers/math.ts';
import { SCENES, SURFACE_Y, canyonCentre, canyonWidthAt } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/**
 * VI. Atlantis: three great gates open onto a round plaza where Mara's light hangs over a ring of rune
 * stones; the city rises in terraces behind. When the light is returned, a pillar of light climbs to
 * the surface and the city wakes, its windows lighting in a wave from the heart outwards.
 */
export default class AtlantisScene extends DiveScene {
	private static readonly PLAZA_RADIUS = 22;
	private static readonly PLAZA_HEIGHT = 2;
	private static readonly HEART_HEIGHT = 11;
	private static readonly WAKE_SPEED = 18;
	private static readonly LIGHT_POWER = 700;

	/** Where the plaza floor is. */
	public readonly plaza: Vector3;
	/** Mara's light, floating over the plaza: the last stop. */
	public readonly heart: Vector3;

	private readonly _city: IMaterialPatch;
	private readonly _litRadius = { value: 0 };
	private readonly _heartMaterial = new MeshBasicMaterial({ color: new Color('#7ff6e8') });
	private readonly _ringMaterial = new MeshBasicMaterial({
		color: new Color('#7ff6e8'),
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending
	});
	private readonly _pillar: Mesh<CylinderGeometry, ShaderMaterial>;
	private readonly _pillarIntensity = { value: 0 };
	private readonly _halos: Mesh[] = [];
	private readonly _runeStones: MeshStandardMaterial[] = [];
	private readonly _light = new PointLight('#7ff6e8', 0, 160, 1.4);
	private readonly _owned: (BufferGeometry | Material)[] = [this._heartMaterial, this._ringMaterial];
	private _isAwake = false;
	private _glow = 0;

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
		this.plaza = base.clone().setY(base.y + AtlantisScene.PLAZA_HEIGHT);
		this.heart = this.plaza.clone().setY(this.plaza.y + AtlantisScene.HEART_HEIGHT);
		this.keepClear.push({ centre: this.plaza, radius: AtlantisScene.PLAZA_RADIUS + 18 });

		this._pillar = this.buildPillar();
		this.buildPlaza(base);
		this.buildHeart();
		this.buildGates();
		this.buildCity();

		this._light.position.copy(this.heart);

		this.own(new JellyfishBloom(context.water, this.drift(34), '#7ff6e8', 98));
		this.lanternfish(this.centre.clone().add(new Vector3(-30, 22, 20)), 140, '#7ff6e8', 901);
		this.lanternfish(this.centre.clone().add(new Vector3(35, 28, -15)), 140, '#5ef2e0', 902);
		this.lanternfish(this.centre.clone().add(new Vector3(0, 40, 40)), 120, '#9d7bff', 903);
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
		this._glow = 0;
	}

	public override update(frame: IFrameContext): void {
		if (this._isAwake) {
			this._litRadius.value = Math.min(400, this._litRadius.value + frame.delta * AtlantisScene.WAKE_SPEED);
		}

		this._glow = damp(this._glow, this._isAwake ? 1 : 0.1, 0.6, frame.delta);

		const pulse = 0.85 + Math.sin(frame.elapsed * 2) * 0.15;
		this._heartMaterial.color.setRGB(0.5, 0.96, 0.91).multiplyScalar(0.6 + this._glow * 3 * pulse);
		this._ringMaterial.color.setRGB(0.5, 0.96, 0.91).multiplyScalar(this._glow * 1.6 * pulse);
		this._ringMaterial.opacity = 0.25 + this._glow * 0.75;
		this._pillarIntensity.value = Math.max(0, this._glow - 0.1) * 0.75;
		this._light.intensity = this._glow * AtlantisScene.LIGHT_POWER;
		this._runeStones.forEach((material) => (material.emissiveIntensity = this._glow * 2.6 * pulse));
		this._halos.forEach((halo, index) => {
			halo.rotation.x = frame.elapsed * (0.12 + index * 0.05) + index;
			halo.rotation.y = frame.elapsed * (0.09 - index * 0.03);
		});
	}

	public override dispose(): void {
		super.dispose();
		this._owned.forEach((item) => item.dispose());
		this._light.dispose();
	}

	private stone(scale: number): IMaterialPatch {
		return triplanar(this.context.assets.texture('large_sandstone_blocks_01', 'diffuse'), scale);
	}

	/** A raised round plaza with concentric rune rings inlaid, ruined columns around its rim. */
	private buildPlaza(base: Vector3): void {
		const radius = AtlantisScene.PLAZA_RADIUS;
		const floor = new CylinderGeometry(radius, radius + 3, AtlantisScene.PLAZA_HEIGHT + 4, 48, 1).translate(
			0,
			(AtlantisScene.PLAZA_HEIGHT + 4) / 2 - 4,
			0
		);
		const material = patchMaterial(
			new MeshStandardMaterial({ color: '#bfc4bc', roughness: 0.9 }),
			this.context.water.caustics,
			this.stone(0.2),
			this._city
		);
		this._owned.push(floor, material);

		const mesh = new Mesh(floor, material);
		mesh.position.copy(base);
		this.add(mesh);

		[6, 11, 16].forEach((ringRadius) => {
			const ring = new RingGeometry(ringRadius - 0.12, ringRadius + 0.12, 96).rotateX(-Math.PI / 2);
			this._owned.push(ring);
			const inlay = new Mesh(ring, this._ringMaterial);
			inlay.position.copy(this.plaza).setY(this.plaza.y + 0.04);
			this.add(inlay);
		});

		const columns: IPropPlacement[] = [...Array(16).keys()].map((index) => {
			const angle = (index / 16) * Math.PI * 2;

			return {
				position: new Vector3(
					this.plaza.x + Math.cos(angle) * (radius - 1.5),
					this.plaza.y,
					this.plaza.z + Math.sin(angle) * (radius - 1.5)
				),
				scale: index % 5 === 2 ? 0.45 : this.random.range(0.9, 1.05),
				rotation: new Euler(0, this.random.range(0, Math.PI * 2), 0)
			};
		});
		this.instancedModel('old_ruined_column', columns, {
			size: 12,
			sink: 0,
			isObstacle: true,
			material: { color: '#d4d6cc', patches: [this.stone(0.35)] }
		});

		const stones = [...Array(8).keys()].map((index) => {
			const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;

			return {
				position: new Vector3(this.plaza.x + Math.cos(angle) * 9, this.plaza.y, this.plaza.z + Math.sin(angle) * 9),
				scale: 1,
				rotation: new Euler(0, -angle - Math.PI / 2, 0)
			};
		});
		this._runeStones.push(...this.instancedModel('elder_stones', stones, { size: 5, sink: 0, material: {} }));
		this._runeStones.forEach((stone) => (stone.emissiveIntensity = 0));
	}

	/** Mara's light: a crystal over the plaza with slow rings turning around it. */
	private buildHeart(): void {
		const crystal = new OctahedronGeometry(1.6, 0).scale(1, 1.7, 1);
		this._owned.push(crystal);

		const mesh = new Mesh(crystal, this._heartMaterial);
		mesh.position.copy(this.heart);
		this.add(mesh);

		[3.2, 4.4, 5.8].forEach((radius) => {
			const torus = new TorusGeometry(radius, 0.05, 6, 96);
			this._owned.push(torus);
			const halo = new Mesh(torus, this._ringMaterial);
			halo.position.copy(this.heart);
			this._halos.push(halo);
			this.add(halo);
		});

		this._pillar.position.copy(this.heart);
		this.add(this._pillar);
	}

	/** A beam from the heart to the surface, lit when the city wakes. */
	private buildPillar(): Mesh<CylinderGeometry, ShaderMaterial> {
		const height = SURFACE_Y - this.heart.y + 20;
		const geometry = new CylinderGeometry(2.6, 1.4, height, 32, 1, true).translate(0, height / 2, 0);
		const material = new ShaderMaterial({
			uniforms: {
				uColor: { value: new Color('#9ffcf0') },
				uIntensity: this._pillarIntensity,
				uTime: this.context.water.time
			},
			vertexShader: pillarVertex,
			fragmentShader: pillarFragment,
			transparent: true,
			depthWrite: false,
			blending: AdditiveBlending
		});
		this._owned.push(geometry, material);

		const pillar = new Mesh(geometry, material);
		pillar.frustumCulled = false;

		return pillar;
	}

	/** Three great gates on the avenues into the plaza, each facing the heart. */
	private buildGates(): void {
		[Math.PI / 2, Math.PI / 2 + (Math.PI * 2) / 3, Math.PI / 2 - (Math.PI * 2) / 3].forEach((angle) => {
			const position = this.ground(this.plaza.x + Math.cos(angle) * 36, this.plaza.z + Math.sin(angle) * 36, -0.4);
			this.placeModel('half_temple_of_apollon_portara', position, 15, new Euler(0, -angle + Math.PI / 2, 0));
		});
	}

	/** Terraces of domes, towers and houses behind the plaza, lower in front, taller further out. */
	private buildCity(): void {
		const { props } = this.context;
		const domes: IPropPlacement[] = [];
		const towers: IPropPlacement[] = [];
		const blocks: IPropPlacement[] = [];

		this.belt(14, 44, 62).forEach((position) =>
			domes.push({ position, scale: this.random.range(5, 8.5), color: '#b7c4c2' })
		);

		this.belt(40, 58, 120).forEach((position) => {
			const radius = this.random.range(2, 4);
			const reach = Math.hypot(position.x - this.centre.x, position.z - this.centre.z);
			// Further out, taller: the city climbs the basin's sides
			const height = this.random.range(10, 20) + (reach - 58) * 0.25;
			towers.push({
				position,
				scale: new Vector3(radius, height, radius),
				color: this.random.next() > 0.5 ? '#aab8b8' : '#c3c8bd'
			});
		});

		this.belt(130, 44, 160).forEach((position) => {
			const width = this.random.range(3, 7);
			blocks.push({
				position: position.setY(position.y + width * 0.2),
				scale: new Vector3(width, this.random.range(2.5, 6), this.random.range(3, 7)),
				rotation: new Euler(0, this.random.range(0, Math.PI), 0),
				color: this.random.next() > 0.5 ? '#bcc2b6' : '#cfd0c4'
			});
		});

		const options = { roughness: 0.88 };
		const stone = this.stone(0.25);

		this.add(
			props.instanced(PropKind.DOME, domes, '#b7c4c2', options, stone, this._city),
			props.instanced(PropKind.TOWER, towers, '#aab8b8', options, stone, this._city),
			props.instanced(PropKind.BLOCK, blocks, '#bcc2b6', options, stone, this._city)
		);
	}

	/** Random points in a ring band around the plaza, inside the canyon, clear of the avenues. */
	private belt(count: number, inner: number, outer: number): Vector3[] {
		const points: Vector3[] = [];
		const avenues = [Math.PI / 2, Math.PI / 2 + (Math.PI * 2) / 3, Math.PI / 2 - (Math.PI * 2) / 3];
		let attempts = 0;

		while (points.length < count && attempts < count * 30) {
			attempts++;

			const angle = this.random.range(0, Math.PI * 2);
			const radius = Math.sqrt(this.random.range(inner * inner, outer * outer));
			const x = this.plaza.x + Math.cos(angle) * radius;
			const z = this.plaza.z + Math.sin(angle) * radius;
			const onAvenue = avenues.some(
				(avenue) => Math.abs(Math.atan2(Math.sin(angle - avenue), Math.cos(angle - avenue))) < 0.34
			);

			if (!onAvenue && Math.abs(x - canyonCentre(z)) < canyonWidthAt(z) * 0.55) {
				points.push(this.ground(x, z, -0.3));
			}
		}

		return points;
	}

	private drift(count: number): Vector3[] {
		return [...Array(count).keys()].map(() =>
			this.centre
				.clone()
				.add(new Vector3(this.random.range(-80, 80), this.random.range(15, 50), this.random.range(-80, 80)))
		);
	}
}
