import {
	AdditiveBlending,
	BufferGeometry,
	Color,
	Float32BufferAttribute,
	Group,
	Mesh,
	MeshBasicMaterial,
	Points,
	RingGeometry,
	ShaderMaterial,
	Vector3
} from 'three';
import vertexShader from '../../../shaders/effects/vent.vertex.glsl';
import fragmentShader from '../../../shaders/effects/vent.fragment.glsl';
import SeededRandom from '../../Helpers/SeededRandom.ts';
import type WaterUniforms from '../Water/WaterUniforms.ts';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

interface IVentUniformValues {
	uTime: number;
	uSize: number;
	uPixelRatio: number;
	uHeight: number;
	uColor: Color;
}

/** A column of rising air from a seabed vent. Swim into it to breathe. Animated entirely on the GPU. */
export default class AirVent extends Group implements IDisposable {
	private static readonly PARTICLES = 220;

	public readonly anchor: Vector3;
	public readonly height: number;
	public readonly radius = 3.2;

	private readonly _points: Points<BufferGeometry, ShaderMaterial>;
	private readonly _ring: Mesh<RingGeometry, MeshBasicMaterial>;
	private readonly _uniforms: TypedUniforms<IVentUniformValues>;

	constructor(water: WaterUniforms, anchor: Vector3, height: number, seed: number) {
		super();

		this.anchor = anchor.clone();
		this.height = height;
		this.position.copy(anchor);

		const random = new SeededRandom(seed);
		const seeds = new Float32Array(AirVent.PARTICLES * 3);

		for (let i = 0; i < seeds.length; i++) {
			seeds[i] = random.next();
		}

		const geometry = new BufferGeometry();
		geometry.setAttribute('aSeed', new Float32BufferAttribute(seeds, 3));
		geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(AirVent.PARTICLES * 3), 3));
		geometry.boundingSphere = null;

		this._uniforms = {
			uTime: water.time,
			uSize: { value: 70 },
			uPixelRatio: { value: 1 },
			uHeight: { value: height },
			uColor: { value: new Color('#e6fdff') }
		};

		this._points = new Points(
			geometry,
			new ShaderMaterial({
				uniforms: this._uniforms,
				vertexShader,
				fragmentShader,
				transparent: true,
				depthWrite: false,
				blending: AdditiveBlending
			})
		);
		this._points.frustumCulled = false;

		this._ring = new Mesh(
			new RingGeometry(0.6, 2.4, 32, 1).rotateX(-Math.PI / 2),
			new MeshBasicMaterial({
				color: '#7ff6ff',
				transparent: true,
				opacity: 0.35,
				blending: AdditiveBlending,
				depthWrite: false,
				fog: false
			})
		);
		this._ring.position.y = 0.15;

		this.add(this._points, this._ring);
	}

	public set pixelRatio(value: number) {
		this._uniforms.uPixelRatio.value = value;
	}

	/** True while a point is inside the bubble column. */
	public contains(point: Vector3): boolean {
		const dy = point.y - this.anchor.y;

		return dy > -1 && dy < this.height && Math.hypot(point.x - this.anchor.x, point.z - this.anchor.z) < this.radius;
	}

	public update(elapsed: number): void {
		this._ring.material.opacity = 0.25 + Math.sin(elapsed * 2.2) * 0.12;
	}

	public override dispose(): void {
		this._points.geometry.dispose();
		this._points.material.dispose();
		this._ring.geometry.dispose();
		this._ring.material.dispose();
		super.dispose();
	}
}
