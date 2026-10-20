import {
	BoxGeometry,
	Color,
	Euler,
	Matrix4,
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
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import DiveScene from './DiveScene.ts';
import JellyfishBloom from '../Life/JellyfishBloom.ts';
import { triplanar } from '../Materials/triplanar.ts';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import { damp } from '../../Helpers/math.ts';
import { SCENES } from '../../Config/world.ts';
import { SceneId } from '../../Enums/SceneId.ts';
import type { IPropPlacement } from '../Props/PropFactory.ts';
import type ISceneContext from './ISceneContext.ts';
import type IFrameContext from '../../Contracts/IFrameContext.ts';

type Block = readonly [x: number, y: number, z: number, width: number, height: number, depth: number];

/**
 * V. The Drowned Temple: a broken colonnade on a stepped platform, the great gate of a sanctum long
 * gone, a bronze whale on the altar inside a ring of rune stones, and two stone guardians at the steps.
 * When Mara's light returns, the runes, the guardians and the altar wake.
 */
export default class TempleScene extends DiveScene {
	private static readonly TOP = 3;
	private static readonly COLUMN_HEIGHT = 11;

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

		this.origin = this.ground(this.centre.x, this.centre.z, -0.5);
		this.altar = this.toWorld(0, TempleScene.TOP + 1.4, -12);
		this.keepClear.push({ centre: this.origin, radius: 30 });

		const top = TempleScene.TOP;

		this.add(
			this.sandstone([
				// Stepped platform and the altar block
				[0, 0.75, 0, 40, 1.5, 56],
				[0, 2.25, 0, 34, 1.5, 50],
				[0, top + 0.7, -12, 2.6, 1.4, 1.8]
			])
		);

		this.buildColonnade();
		this.buildSanctum();
		this.buildGuardian(-13.5);
		this.buildGuardian(13.5);
		this.buildStatuary();

		this.own(new JellyfishBloom(context.water, this.halo(18), '#5ff7ea', 72));
		this.instancedModel('rock_moss_set_01', this.placements(this.scatter(14, 100), 2, 4), {
			sink: 0.3,
			isObstacle: true
		});
		this.instancedModel('rock_moss_set_02', this.placements(this.scatter(8, 100), 2.5, 5), {
			sink: 0.3,
			isObstacle: true
		});
		this.lanternfish(this.toWorld(-18, 14, 10), 120, '#5ef2e0', 701);
		this.lanternfish(this.toWorld(16, 18, -20), 100, '#7fd8ff', 702);
		this.predators(this.toWorld(0, 20, 0), 2, 36, 703);
	}

	/** Through the gate, looking at the altar. */
	public get threshold(): Vector3 {
		return this.toWorld(0, TempleScene.TOP + 2.6, 4);
	}

	/** Mara's light settles on the altar and the temple wakes. */
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
		this._glowing.forEach((material) => (material.emissiveIntensity = this._wake * material.userData['glow'] * pulse));
	}

	public override dispose(): void {
		super.dispose();
		this._owned.forEach((item) => item.dispose());
	}

	private toWorld(x: number, y: number, z: number): Vector3 {
		return new Vector3(x, y, z).add(this.origin);
	}

	/** Sandstone boxes merged into one mesh, textured along the world axes. */
	private sandstone(blocks: readonly Block[]): Mesh {
		const matrix = new Matrix4();
		const parts = blocks.map(([x, y, z, width, height, depth]) =>
			new BoxGeometry(width, height, depth).applyMatrix4(matrix.makeTranslation(x, y, z))
		);
		const geometry = mergeGeometries(parts) ?? new BoxGeometry();
		parts.forEach((part) => part.dispose());

		const material = patchMaterial(
			new MeshStandardMaterial({ color: '#757062', roughness: 0.95 }),
			this.context.water.caustics,
			triplanar(this.context.assets.texture('large_sandstone_blocks_01', 'diffuse'), 0.22)
		);
		this._owned.push(geometry, material);

		const mesh = new Mesh(geometry, material);
		mesh.position.copy(this.origin);

		return mesh;
	}

	/** Scanned ruined columns in two rows; some stand to full height, some are stumps, three have fallen. */
	private buildColonnade(): void {
		const standing: IPropPlacement[] = [];
		const top = TempleScene.TOP;

		[-9, 9].forEach((x) => {
			for (let i = 0; i < 9; i++) {
				const z = -18 + i * 4.5;
				const isStump = (i === 2 && x < 0) || (i === 5 && x > 0) || (i === 1 && x > 0) || (i === 7 && x < 0);

				standing.push({
					position: this.toWorld(x, top, z),
					scale: isStump ? this.random.range(0.35, 0.6) : this.random.range(0.92, 1.05),
					rotation: new Euler(0, this.random.range(0, Math.PI * 2), 0)
				});
			}
		});

		const stone = {
			color: '#d8d1bf',
			patches: [triplanar(this.context.assets.texture('large_sandstone_blocks_01', 'diffuse'), 0.35)]
		};

		this.instancedModel('old_ruined_column', standing, {
			size: TempleScene.COLUMN_HEIGHT,
			sink: 0.02,
			isObstacle: true,
			material: stone
		});
		this.instancedModel(
			'old_ruined_column',
			[
				{ position: this.toWorld(13, top, -6), scale: 0.9, rotation: new Euler(Math.PI / 2, 0, -0.4, 'YXZ') },
				{ position: this.toWorld(-12.5, top, 4), scale: 0.85, rotation: new Euler(Math.PI / 2, 0, 0.6, 'YXZ') },
				{
					position: this.ground(this.origin.x + 24, this.origin.z + 12),
					scale: 1,
					rotation: new Euler(Math.PI / 2, 1.2, 0, 'YXZ')
				}
			],
			{ size: TempleScene.COLUMN_HEIGHT, sink: 0.15, isLying: true, material: stone }
		);
	}

	/** The great gate where the sanctum stood, the altar behind it, rune stones in an arc around the altar. */
	private buildSanctum(): void {
		const top = TempleScene.TOP;

		// The scan stands on its own rock islet: sink that under the platform so only the gate rises from it
		this.placeModel('half_temple_of_apollon_portara', this.toWorld(0, top - 3.2, -6), 19, new Euler(0, 0, 0));
		this.placeModel('bronze_whale_statue', this.altar, 1.4, new Euler(0, Math.PI / 2, 0));

		const runeStones = [-0.75, 0, 0.75].map((angle) => ({
			position: this.toWorld(Math.sin(angle) * 5.5, top, -12 - Math.cos(angle) * 5.5),
			scale: 1,
			rotation: new Euler(0, angle, 0)
		}));
		const stones = this.instancedModel('elder_stones', runeStones, { size: 4.5, sink: 0.05, material: {} });
		stones.forEach((material) => {
			material.emissiveIntensity = 0;
			material.userData['glow'] = 2.5;
		});
		this._glowing.push(...stones);

		const socket = new SphereGeometry(0.22, 16, 12);
		this._owned.push(socket);
		const socketMesh = new Mesh(socket, this._socket);
		socketMesh.position.copy(this.altar).setY(this.altar.y + 1.3);
		this.add(socketMesh);
	}

	/** A towering statue at the steps, with a ring of runes at its feet that lights up when it wakes. */
	private buildGuardian(x: number): void {
		const base = this.toWorld(x, TempleScene.TOP, 22);
		const guardian = this.placeModel('gothic_statue', base, 11, new Euler(0, x < 0 ? 0.25 : -0.25, 0));

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
		runes.position.copy(base).setY(base.y + 0.05);
		this.add(runes);
	}

	/** Lions at the steps, a horse and busts toppled into the sand. */
	private buildStatuary(): void {
		const top = TempleScene.TOP;

		this.placeModel('lion_head', this.toWorld(-17, top, 26), 1.8, new Euler(0, 0.2, 0));
		this.placeModel('lion_head', this.toWorld(17, top, 26), 1.8, new Euler(0, -0.2, 0));
		this.placeModel(
			'horse_statue_01',
			this.ground(this.origin.x + 26, this.origin.z + 18, -0.3),
			4.5,
			new Euler(0, 0.8, 1.35)
		);
		this.placeModel(
			'marble_bust_01',
			this.ground(this.origin.x - 22, this.origin.z + 30, -0.2),
			1.6,
			new Euler(0.4, 2.2, 0.9)
		);
		this.placeModel('marble_bust_01', this.toWorld(6.5, top, 26), 1.3, new Euler(0, -0.6, 1.4));
	}

	private halo(count: number): Vector3[] {
		return [...Array(count).keys()].map(() =>
			this.toWorld(this.random.range(-35, 35), this.random.range(10, 26), this.random.range(-40, 40))
		);
	}
}
