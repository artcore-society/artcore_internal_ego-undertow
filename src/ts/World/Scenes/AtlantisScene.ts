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
	ShaderMaterial,
	TorusGeometry,
	Vector2,
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
import { triplanar } from '../Materials/triplanar.ts';
import { damp } from '../../Helpers/math.ts';
import { SCENES, SURFACE_Y } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type { IMaterialPatch } from '../../Helpers/MaterialPatch.ts';
import type { ModelName } from '../../Config/assets.ts';
import type { IPropPlacement } from './IPropPlacement.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/**
 * VI. Atlantis, made only of scanned ruins laid out like a city: three avenues of columns, each guarded
 * by a great gate, meet at a ring of columns around Mara's light, which hangs over a pedestal inside a
 * circle of rune stones. When the light is returned a pillar of light climbs to the surface and the
 * stone wakes in a chain reaction from the heart: racing out along the avenues first, then filling the
 * city between them, every stone flaring as the light reaches it.
 *
 * Layout in city space: the heart at the origin; the approach avenue runs towards +Z.
 */
export default class AtlantisScene extends DiveScene {
	private static readonly HEART_HEIGHT = 9;
	private static readonly WAKE_SPEED = 18;
	private static readonly LIGHT_POWER = 700;
	/** Avenue directions, radians: the approach (+Z) first. */
	private static readonly AVENUES = [Math.PI / 2, Math.PI / 2 + (Math.PI * 2) / 3, Math.PI / 2 - (Math.PI * 2) / 3];
	private static readonly GATE_DISTANCE = 50;
	/** Wake distances (see city.header) where the light reaches the gates, the far temples, the shrines. */
	private static readonly WAKE_MILESTONES = [AtlantisScene.GATE_DISTANCE, 78, 150];
	/** The skyline is seen from twice as far as everything else (see the fog chunk). */
	private static readonly LANDMARK: IMaterialPatch = { key: 'landmark', fragmentHeader: '#define FOG_REACH 0.5' };

	/** The seabed at the heart of the city. */
	public readonly plaza: Vector3;
	/** Mara's light, floating over the pedestal: the last stop. */
	public readonly heart: Vector3;

	private readonly _city: IMaterialPatch;
	private readonly _litRadius = { value: 0 };
	private readonly _pillarIntensity = { value: 0 };
	private readonly _heartMaterial = new MeshBasicMaterial({ color: new Color('#7ff6e8') });
	private readonly _ringMaterial = new MeshBasicMaterial({
		color: new Color('#7ff6e8'),
		transparent: true,
		depthWrite: false,
		blending: AdditiveBlending
	});
	private readonly _halos: Mesh[] = [];
	private readonly _runeStones: MeshStandardMaterial[] = [];
	private readonly _light = new PointLight('#7ff6e8', 0, 160, 1.4);
	private readonly _owned: (BufferGeometry | Material)[] = [this._heartMaterial, this._ringMaterial];
	private _milestoneListener: ((index: number) => void) | null = null;
	private _isAwake = false;
	private _glow = 0;

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.ATLANTIS], context, 97);

		this._city = {
			key: 'city',
			uniforms: {
				uLitRadius: this._litRadius,
				uCityCentre: { value: this.centre.clone() },
				uAvenues: { value: AtlantisScene.AVENUES.map((angle) => new Vector2(Math.cos(angle), Math.sin(angle))) },
				uWindowColor: { value: new Color('#7ff6e8') }
			},
			fragmentHeader: cityHeader,
			fragmentLight: cityFragment
		};

		this.plaza = this.ground(this.centre.x, this.centre.z);
		this.heart = this.plaza.clone().setY(this.floorUnder(this.plaza.x, this.plaza.z, 2) + AtlantisScene.HEART_HEIGHT);
		this.keepClear.push({ centre: this.plaza, radius: 72 });

		this.buildHeart();
		this.buildCircle();
		this.buildAvenues();
		this.buildRuins();
		this.buildSkyline();

		this._light.position.copy(this.heart);

		this.instancedModel('rock_moss_set_01', this.placements(this.scatter(22, 160, 0, 0.55), 2.5, 5), {
			sink: 0.3,
			isObstacle: true
		});
		this.instancedModel('rock_moss_set_02', this.placements(this.scatter(14, 160, 0, 0.55), 3, 6), {
			sink: 0.3,
			isObstacle: true
		});
		this.own(new JellyfishBloom(context.water, this.drift(30), '#7ff6e8', 98));
		this.lanternfish(this.at(-30, 20).setY(this.plaza.y + 20), 140, '#7ff6e8', 901);
		this.lanternfish(this.at(35, -15).setY(this.plaza.y + 26), 140, '#5ef2e0', 902);
		this.lanternfish(this.at(0, 40).setY(this.plaza.y + 34), 120, '#9d7bff', 903);
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

	/** Called as the waking light reaches each landmark (0 = the gates, then the far temples, the shrines). */
	public onWakeMilestone(listener: (index: number) => void): void {
		this._milestoneListener = listener;
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
			const previous = this._litRadius.value;
			this._litRadius.value = Math.min(400, previous + frame.delta * AtlantisScene.WAKE_SPEED);
			AtlantisScene.WAKE_MILESTONES.forEach((milestone, index) => {
				if (previous < milestone && this._litRadius.value >= milestone) {
					this._milestoneListener?.(index);
				}
			});
		}

		this._glow = damp(this._glow, this._isAwake ? 1 : 0.12, 0.6, frame.delta);

		const pulse = 0.85 + Math.sin(frame.elapsed * 2) * 0.15;
		this._heartMaterial.color.setRGB(0.5, 0.96, 0.91).multiplyScalar(0.8 + this._glow * 1.8 * pulse);
		this._ringMaterial.color.setRGB(0.5, 0.96, 0.91).multiplyScalar((0.25 + this._glow * 0.55) * pulse);
		this._ringMaterial.opacity = 0.35 + this._glow * 0.65;
		this._pillarIntensity.value = Math.max(0, this._glow - 0.12) * 0.75;
		this._light.intensity = this._glow * AtlantisScene.LIGHT_POWER;
		this._runeStones.forEach((material) => (material.emissiveIntensity = (0.15 + this._glow * 2.4) * pulse));
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

	/** City space → world (y on the plaza's level; models ground themselves). */
	private at(x: number, z: number): Vector3 {
		return new Vector3(this.plaza.x + x, this.plaza.y, this.plaza.z + z);
	}

	/** A point at `distance` along an avenue, `offset` metres to its side. */
	private onAvenue(angle: number, distance: number, offset = 0): Vector3 {
		return this.at(
			Math.cos(angle) * distance - Math.sin(angle) * offset,
			Math.sin(angle) * distance + Math.cos(angle) * offset
		);
	}

	private stone(): { color: string; patches: IMaterialPatch[] } {
		return {
			color: '#a9b2ad',
			patches: [triplanar(this.context.assets.texture('large_sandstone_blocks_01', 'diffuse'), 0.35), this._city]
		};
	}

	/**
	 * The city beyond the columns: temples standing on a wide ring between the avenues, dark shapes in
	 * the murk until the waking light reaches them.
	 */
	private buildSkyline(): void {
		const stone = this.stone();
		// Facing the heart: each model's front is towards its own +Z
		const facing = (angle: number): Euler => new Euler(0, -Math.PI / 2 - angle, 0);
		const building = (name: ModelName, angle: number, distance: number, size: number): void => {
			this.instancedModel(name, [{ position: this.onAvenue(angle, distance), scale: 1, rotation: facing(angle) }], {
				size,
				sink: 0.03,
				material: { ...stone, patches: [...stone.patches, AtlantisScene.LANDMARK] }
			});
		};

		const approach = AtlantisScene.AVENUES[0] ?? Math.PI / 2;
		const behind = approach + Math.PI;

		// Straight behind the heart, seen all the way down the approach: the great temple
		building('greek_style_ancient_temple', behind, 80, 44);
		// Closing the far end of the other two avenues
		building('roman_greco_temple_aged', AtlantisScene.AVENUES[1] ?? behind, 76, 28);
		building('roman_greco_temple_aged', AtlantisScene.AVENUES[2] ?? behind, 76, 28);
		// Round shrines between them, a little further out, and two more flanking the approach
		building('greek_tholos', behind - 0.55, 88, 15);
		building('greek_tholos', behind + 0.55, 88, 15);
		building('greek_tholos', approach - 1.3, 80, 13);
		building('greek_tholos', approach + 1.3, 80, 13);
	}

	/** Mara's light: a crystal over a boulder pedestal, slow rings turning around it, a pillar of light above. */
	private buildHeart(): void {
		this.instancedModel('boulder_01', [{ position: this.at(0, 0), scale: 1 }], {
			size: 3.4,
			sink: 0.25,
			material: { patches: [this._city] }
		});

		const crystal = new OctahedronGeometry(1.5, 0).scale(1, 1.7, 1);
		this._owned.push(crystal);
		const mesh = new Mesh(crystal, this._heartMaterial);
		mesh.position.copy(this.heart);
		this.add(mesh);

		[3, 4.2, 5.6].forEach((radius) => {
			const torus = new TorusGeometry(radius, 0.05, 6, 96);
			this._owned.push(torus);
			const halo = new Mesh(torus, this._ringMaterial);
			halo.position.copy(this.heart);
			this._halos.push(halo);
			this.add(halo);
		});

		const height = SURFACE_Y - this.heart.y + 20;
		const beam = new CylinderGeometry(2.6, 1.4, height, 32, 1, true).translate(0, height / 2, 0);
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
		this._owned.push(beam, material);

		const pillar = new Mesh(beam, material);
		pillar.position.copy(this.heart);
		pillar.frustumCulled = false;
		this.add(pillar);
	}

	/** Rune stones in a circle around the pedestal, a ring of columns around them, broken where the avenues enter. */
	private buildCircle(): void {
		const stones = [...Array(8).keys()].map((index) => {
			const angle = (index / 8) * Math.PI * 2 + Math.PI / 8;

			return {
				position: this.at(Math.cos(angle) * 9, Math.sin(angle) * 9),
				scale: 1,
				rotation: new Euler(0, -angle - Math.PI / 2, 0)
			};
		});
		const runes = this.runeStones(stones, 3.6);
		runes.forEach((material) => (material.emissiveIntensity = 0.15));
		this._runeStones.push(...runes);

		const ring: IPropPlacement[] = [];

		for (let index = 0; index < 15; index++) {
			const angle = (index / 15) * Math.PI * 2;
			const isOnAvenue = AtlantisScene.AVENUES.some(
				(avenue) => Math.abs(Math.atan2(Math.sin(angle - avenue), Math.cos(angle - avenue))) < 0.22
			);

			if (!isOnAvenue) {
				ring.push({
					position: this.at(Math.cos(angle) * 18, Math.sin(angle) * 18),
					scale: index % 4 === 1 ? this.random.range(0.4, 0.55) : this.random.range(0.95, 1.08),
					rotation: new Euler(0, this.random.range(0, Math.PI * 2), 0)
				});
			}
		}

		this.instancedModel('old_ruined_column', ring, { size: 12, sink: 0.04, isObstacle: true, material: this.stone() });
	}

	/** Each avenue: paired columns leading out, a great gate across it, statues along the approach. */
	private buildAvenues(): void {
		const columns: IPropPlacement[] = [];

		AtlantisScene.AVENUES.forEach((angle, avenue) => {
			for (let step = 0; step < 5; step++) {
				const distance = 26 + step * 8;

				if (distance > AtlantisScene.GATE_DISTANCE - 6 && distance < AtlantisScene.GATE_DISTANCE + 6) {
					continue;
				}

				[-1, 1].forEach((side) => {
					const isStump = (step + avenue + (side > 0 ? 1 : 0)) % 3 === 0;
					columns.push({
						position: this.onAvenue(angle, distance, side * 7),
						scale: isStump ? this.random.range(0.35, 0.55) : this.random.range(0.92, 1.05),
						rotation: new Euler(0, this.random.range(0, Math.PI * 2), 0)
					});
				});
			}

			// The gate faces the heart, straddling the avenue
			this.placeModel(
				'half_temple_of_apollon_portara',
				this.onAvenue(angle, AtlantisScene.GATE_DISTANCE),
				16,
				new Euler(0, Math.PI / 2 - angle, 0),
				{
					sink: 0.12
				}
			);
		});

		this.instancedModel('old_ruined_column', columns, {
			size: 12,
			sink: 0.04,
			isObstacle: true,
			material: this.stone()
		});

		// Statues watch the approach from either side, well clear of the columns, facing the diver
		// (the model faces +Z) and turned a little towards the avenue
		const approach = AtlantisScene.AVENUES[0] ?? Math.PI / 2;
		this.placeModel('gothic_statue', this.onAvenue(approach, 34, -14), 9, new Euler(0, -0.5, 0), {
			sink: 0.03
		});
		this.placeModel('gothic_statue', this.onAvenue(approach, 34, 14), 9, new Euler(0, 0.5, 0), {
			sink: 0.03
		});
	}

	/** Fallen columns, toppled statues, and pale deep-water coral over everything between the avenues. */
	private buildRuins(): void {
		const between = (count: number, inner: number, outer: number): Vector3[] =>
			[...Array(count * 4).keys()]
				.map(() => {
					const angle = this.random.range(0, Math.PI * 2);
					const distance = Math.sqrt(this.random.range(inner * inner, outer * outer));

					return { angle, point: this.at(Math.cos(angle) * distance, Math.sin(angle) * distance) };
				})
				.filter(({ angle }) =>
					AtlantisScene.AVENUES.every(
						(avenue) => Math.abs(Math.atan2(Math.sin(angle - avenue), Math.cos(angle - avenue))) > 0.35
					)
				)
				.slice(0, count)
				.map(({ point }) => point);

		this.instancedModel(
			'old_ruined_column',
			between(9, 22, 66).map((position) => ({
				position,
				scale: this.random.range(0.7, 1),
				rotation: new Euler(Math.PI / 2, this.random.range(0, Math.PI * 2), 0, 'YXZ')
			})),
			{ size: 12, sink: 0.15, material: this.stone() }
		);

		between(3, 24, 60).forEach((position, index) => {
			this.placeModel(
				index === 0 ? 'horse_statue_01' : 'marble_bust_01',
				position,
				index === 0 ? 4.5 : 1.6,
				new Euler(0.3, this.random.range(0, 6), 1.3),
				{ sink: 0.25 }
			);
		});
		between(2, 20, 40).forEach((position) =>
			this.placeModel('lion_head', position, 1.8, new Euler(0, this.random.range(0, 6), 0))
		);

		const pale = ['#c9c4d6', '#b6c9cc', '#d6cdbd'];
		this.instancedModel('acropora_cervicornis_detail_view', this.placements(between(18, 20, 70), 0.6, 1.2, pale), {
			size: 1.5,
			sink: 0.08
		});
		this.instancedModel('pocillopora_damicornis_caespitosa', this.placements(between(8, 20, 70), 0.6, 1.1, pale), {
			size: 1,
			sink: 0.25
		});
		this.instancedModel('blue_sea_anemone_l', this.placements(between(6, 20, 60), 0.7, 1.1), { size: 1, sink: 0.2 });
	}

	private drift(count: number): Vector3[] {
		return [...Array(count).keys()].map(() =>
			this.at(this.random.range(-80, 80), this.random.range(-80, 80)).setY(this.plaza.y + this.random.range(14, 50))
		);
	}
}
