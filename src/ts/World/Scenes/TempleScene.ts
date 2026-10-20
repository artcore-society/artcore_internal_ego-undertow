import {
	Color,
	Euler,
	Mesh,
	MeshBasicMaterial,
	MeshStandardMaterial,
	Object3D,
	RingGeometry,
	SphereGeometry,
	Vector3,
	type BufferGeometry,
	type Material
} from 'three';
import DiveScene from './DiveScene.ts';
import JellyfishBloom from '../Life/JellyfishBloom.ts';
import { triplanar } from '../Materials/triplanar.ts';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import { damp } from '../../Helpers/math.ts';
import { SCENES } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type { IPropPlacement } from './IPropPlacement.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

/**
 * V. The Drowned Temple, made only of scanned pieces: an avenue of broken columns on the seabed leads
 * past two stone guardians to a great gate; through it, the altar (a bronze whale on a boulder) inside
 * an arc of rune stones. When Mara's light returns, runes, guardians and altar wake.
 *
 * Layout in temple space: the gate at the origin, the avenue towards +Z (where the diver comes from).
 */
export default class TempleScene extends DiveScene {
	private static readonly COLUMN_HEIGHT = 11;
	private static readonly AVENUE = { halfWidth: 7, from: 14, step: 5, count: 6 } as const;
	private static readonly GUARDIANS = { x: 13.5, z: 50 } as const;
	private static readonly ALTAR_Z = -9;

	public readonly origin: Vector3;
	public readonly altar: Vector3;

	private readonly _runes = new MeshBasicMaterial({
		color: new Color('#5ef2e0'),
		transparent: true,
		depthWrite: false
	});
	private readonly _socket = new MeshBasicMaterial({ color: new Color('#8ffcff') });
	private readonly _glowing: MeshStandardMaterial[] = [];
	private readonly _owned: (BufferGeometry | Material)[] = [this._runes, this._socket];
	private _wake = 0;
	private _wakeTarget = 0;

	constructor(context: ISceneContext) {
		super(SCENES[SceneId.TEMPLE], context, 71);

		this.origin = this.ground(this.centre.x, this.centre.z);
		// Keep the avenue and the sanctum free of scattered rocks
		[-12, 0, 15, 30, 45].forEach((z) => this.keepClear.push({ centre: this.at(0, z), radius: 18 }));

		this.buildSanctum();
		this.buildAvenue();
		this.buildGuardian(-1);
		this.buildGuardian(1);
		this.buildRuins();

		const altarBase = this.floorUnder(this.origin.x, this.origin.z + TempleScene.ALTAR_Z, 1.2);
		this.altar = this.at(0, TempleScene.ALTAR_Z).setY(altarBase + 1.7);
		this.buildAltar();

		this.own(new JellyfishBloom(context.water, this.halo(18), '#5ff7ea', 72));
		this.instancedModel('rock_moss_set_01', this.placements(this.scatter(16, 100), 2, 4), {
			sink: 0.3,
			isObstacle: true
		});
		this.instancedModel('rock_moss_set_02', this.placements(this.scatter(8, 100), 2.5, 5), {
			sink: 0.3,
			isObstacle: true
		});
		this.lanternfish(this.at(-18, 20).setY(this.origin.y + 12), 120, '#5ef2e0', 701);
		this.lanternfish(this.at(16, -10).setY(this.origin.y + 16), 100, '#7fd8ff', 702);
		this.predators(this.origin.clone().setY(this.origin.y + 18), 2, 40, 703);
	}

	/** In front of the gate, looking through it at the altar. */
	public get threshold(): Vector3 {
		return this.at(0, 7).setY(this.origin.y + 3.4);
	}

	/** A point on the avenue, for camera shots: `height` metres above the seabed there. */
	public above(x: number, z: number, height: number): Vector3 {
		const point = this.at(x, z);

		return point.setY(this.context.terrain.heightAt(point.x, point.z) + height);
	}

	public wake(): void {
		this._wakeTarget = 1;
	}

	public reset(): void {
		this._wake = 0;
		this._wakeTarget = 0;
	}

	public override update(frame: IFrameContext): void {
		this._wake = damp(this._wake, this._wakeTarget, 0.6, frame.delta);

		const pulse = 0.8 + Math.sin(frame.elapsed * 1.5) * 0.2;
		// Asleep, the runes still smoulder faintly: enough to find the temple in the dark
		const runes = 0.12 + this._wake * 0.88;
		this._runes.color.setRGB(0.37, 0.95, 0.88).multiplyScalar(runes * 4 * pulse);
		this._runes.opacity = runes;
		this._socket.color.setRGB(0.56, 0.99, 1).multiplyScalar(0.5 + this._wake * (4 + Math.sin(frame.elapsed * 3)));
		this._glowing.forEach(
			(material) => (material.emissiveIntensity = this._wake * (material.userData['glow'] as number) * pulse)
		);
	}

	public override dispose(): void {
		super.dispose();
		this._owned.forEach((item) => item.dispose());
	}

	/** Temple space → world (y on the seabed's general level; models ground themselves). */
	private at(x: number, z: number): Vector3 {
		return new Vector3(this.origin.x + x, this.origin.y, this.origin.z + z);
	}

	private stone(): { color: string; patches: ReturnType<typeof triplanar>[] } {
		return {
			color: '#a8a291',
			patches: [triplanar(this.context.assets.texture('large_sandstone_blocks_01', 'diffuse'), 0.35)]
		};
	}

	/** The great gate, standing on its own rock. */
	private buildSanctum(): void {
		this.placeModel('half_temple_of_apollon_portara', this.at(0, 0), 15, new Euler(0, 0, 0), { sink: 0.12 });
	}

	/** The altar inside the gate: a boulder with the bronze whale, rune stones in an arc behind. */
	private buildAltar(): void {
		this.instancedModel('boulder_01', [{ position: this.at(0, TempleScene.ALTAR_Z), scale: 1 }], {
			size: 2.4,
			sink: 0.3
		});
		this.placeModel(
			'bronze_whale_statue',
			this.altar.clone().setY(this.altar.y - 0.15),
			1.4,
			new Euler(0, Math.PI / 2, 0),
			{ isAboveGround: true }
		);

		const runeStones = [-0.8, -0.27, 0.27, 0.8].map((angle) => ({
			position: this.at(Math.sin(angle) * 6, TempleScene.ALTAR_Z - Math.cos(angle) * 6),
			scale: 1,
			rotation: new Euler(0, angle, 0)
		}));
		const stones = this.runeStones(runeStones, 3.6);
		stones.forEach((material) => {
			material.emissiveIntensity = 0;
			material.userData['glow'] = 2.5;
		});
		this._glowing.push(...stones);

		const socket = new SphereGeometry(0.22, 16, 12);
		this._owned.push(socket);
		const socketMesh = new Mesh(socket, this._socket);
		socketMesh.position.copy(this.altar).setY(this.altar.y + 1.2);
		this.add(socketMesh);
	}

	/** Two rows of ruined columns along the approach; some full height, some stumps, three fallen. */
	private buildAvenue(): void {
		const { halfWidth, from, step, count } = TempleScene.AVENUE;
		const standing: IPropPlacement[] = [];

		[-1, 1].forEach((side) => {
			for (let i = 0; i < count; i++) {
				const isStump = (side < 0 && (i === 1 || i === 4)) || (side > 0 && i === 2);

				standing.push({
					position: this.at(side * halfWidth, from + i * step),
					scale: isStump ? this.random.range(0.35, 0.55) : this.random.range(0.92, 1.05),
					rotation: new Euler(0, this.random.range(0, Math.PI * 2), 0)
				});
			}
		});

		this.instancedModel('old_ruined_column', standing, {
			size: TempleScene.COLUMN_HEIGHT,
			sink: 0.04,
			isObstacle: true,
			material: this.stone()
		});
		this.instancedModel(
			'old_ruined_column',
			[
				{ position: this.at(-12, 22), scale: 0.9, rotation: new Euler(Math.PI / 2, -0.3, 0, 'YXZ') },
				{ position: this.at(12.5, 32), scale: 0.85, rotation: new Euler(Math.PI / 2, 0.5, 0, 'YXZ') },
				{ position: this.at(-14, 4), scale: 1, rotation: new Euler(Math.PI / 2, 1.3, 0, 'YXZ') }
			],
			{ size: TempleScene.COLUMN_HEIGHT, sink: 0.15, material: this.stone() }
		);
	}

	/** A stone guardian at the avenue's mouth, facing the diver; runes ring its feet. */
	private buildGuardian(side: -1 | 1): void {
		const { x, z } = TempleScene.GUARDIANS;
		const position = this.at(side * x, z);
		// The statue model faces -Z: turn it round to face the diver coming down the avenue
		const guardian = this.placeModel('gothic_statue', position, 11, new Euler(0, Math.PI - side * 0.3, 0), {
			sink: 0.03
		});

		guardian.traverse((child: Object3D) => {
			if (child instanceof Mesh) {
				const material = patchMaterial((child.material as MeshStandardMaterial).clone(), this.context.water.caustics);
				material.emissive = new Color('#2fd6c8');
				material.emissiveIntensity = 0;
				// A faint inner light only: the runes at its feet carry the glow
				material.userData['glow'] = 0.18;
				child.material = material;
				this._glowing.push(material);
				this._owned.push(material);
			}
		});

		const ring = new RingGeometry(2.6, 3.1, 48).rotateX(-Math.PI / 2);
		this._owned.push(ring);
		const runes = new Mesh(ring, this._runes);
		runes.position.copy(position).setY(this.context.terrain.heightAt(position.x, position.z) + 0.08);
		this.add(runes);
	}

	/** Lions guarding the entrance, a horse and busts toppled in the sand, coral growing over it all. */
	private buildRuins(): void {
		this.placeModel('lion_head', this.at(-5, 54), 1.7, new Euler(0, 0.25, 0));
		this.placeModel('lion_head', this.at(5, 54), 1.7, new Euler(0, -0.25, 0));
		this.placeModel('horse_statue_01', this.at(17, 10), 4.5, new Euler(0, 0.8, 1.35), { sink: 0.25 });
		this.placeModel('marble_bust_01', this.at(-16, 34), 1.6, new Euler(0.4, 2.2, 0.9), { sink: 0.2 });
		this.placeModel('marble_bust_01', this.at(10, 58), 1.3, new Euler(0, -0.6, 1.4), { sink: 0.2 });

		const growth = (count: number, spread: number): IPropPlacement[] =>
			[...Array(count).keys()].map(() => ({
				position: this.at(this.random.range(-spread, spread), this.random.range(-14, 58)),
				scale: this.random.range(0.6, 1.1),
				rotation: new Euler(0, this.random.range(0, Math.PI * 2), 0),
				color: ['#7f8c88', '#8f8476', '#6f7f86'][Math.floor(this.random.range(0, 3))] ?? '#7f8c88'
			}));

		this.instancedModel(
			'acropora_cervicornis_detail_view',
			growth(12, 20).filter((placement) => Math.abs(placement.position.x - this.origin.x) > 9),
			{ size: 1.4, sink: 0.08 }
		);
		this.instancedModel(
			'blue_sea_anemone_l',
			growth(5, 18).filter((placement) => Math.abs(placement.position.x - this.origin.x) > 9),
			{ size: 0.9, sink: 0.2 }
		);
	}

	private halo(count: number): Vector3[] {
		return [...Array(count).keys()].map(() =>
			this.at(this.random.range(-35, 35), this.random.range(-20, 60)).setY(this.origin.y + this.random.range(10, 26))
		);
	}
}
