import { BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { patchMaterial } from '../../Helpers/MaterialPatch.ts';
import type LifePatches from './LifePatches.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

/**
 * A manta ray gliding slow, banking loops high over the reef: a dark silhouette against the light
 * coming down. Its body is a few hundred vertices shaped in code, head towards -Z; its wings beat in
 * the vertex shader.
 */
export default class MantaRay extends Group implements IDisposable {
	private static readonly SPAN = 4.2;
	private static readonly LENGTH = 2.6;
	private static readonly ACROSS = 28;
	private static readonly ALONG = 14;

	private readonly _body: Mesh<BufferGeometry, MeshStandardMaterial>;
	private readonly _centre: Vector3;
	private readonly _radius: number;
	private readonly _speed: number;
	private readonly _phase: number;

	/** @param speed radians per second around its loop */
	constructor(
		water: WaterUniforms,
		patches: LifePatches,
		centre: Vector3,
		radius: number,
		speed: number,
		phase: number
	) {
		super();

		this._centre = centre.clone();
		this._radius = radius;
		this._speed = speed;
		this._phase = phase;

		const material = new MeshStandardMaterial({ color: '#27323a', roughness: 0.85, side: DoubleSide });
		this._body = new Mesh(MantaRay.shape(), patchMaterial(material, patches.flap(MantaRay.SPAN / 2), water.caustics));
		this.add(this._body);
	}

	/** A grid bent into a manta: blunt head, wide wings sweeping back to their tips, a domed back. */
	private static shape(): BufferGeometry {
		const positions: number[] = [];
		const indices: number[] = [];
		const halfSpan = MantaRay.SPAN / 2;

		for (let j = 0; j <= MantaRay.ALONG; j++) {
			const along = j / MantaRay.ALONG;
			// Widest a little ahead of the middle, narrowing to a short body at the back
			const halfWidth = halfSpan * Math.pow(Math.sin(Math.PI * Math.pow(along, 0.75)), 0.8) + 0.18;

			for (let i = 0; i <= MantaRay.ACROSS; i++) {
				const across = (i / MantaRay.ACROSS) * 2 - 1;
				const x = across * halfWidth;
				const z = (along - 0.45) * MantaRay.LENGTH + across * across * MantaRay.LENGTH * 0.3;
				const y = 0.16 * (1 - across * across) * Math.sin(Math.PI * along);
				positions.push(x, y, z);
			}
		}

		const row = MantaRay.ACROSS + 1;

		for (let j = 0; j < MantaRay.ALONG; j++) {
			for (let i = 0; i < MantaRay.ACROSS; i++) {
				const a = j * row + i;
				indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
			}
		}

		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();

		return geometry;
	}

	public update(elapsed: number): void {
		const angle = this._phase + elapsed * this._speed;

		this.position.set(
			this._centre.x + Math.cos(angle) * this._radius,
			this._centre.y + Math.sin(angle * 0.5) * 2.5,
			this._centre.z + Math.sin(angle) * this._radius
		);
		// Face along the loop's tangent (forward is -Z), banked into the turn, nose following the climb
		this.rotation.set(Math.cos(angle * 0.5) * 0.08, Math.PI - angle, -0.28 * Math.sign(this._speed), 'YXZ');
	}

	public override dispose(): void {
		this._body.geometry.dispose();
		this._body.material.dispose();
		super.dispose();
	}
}
