import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial, type Vector3 } from 'three';
import vertexShader from '../../../shaders/effects/bubbles.vertex.glsl';
import fragmentShader from '../../../shaders/effects/bubbles.fragment.glsl';
import { SURFACE_Y } from '../../Config/world.ts';
import type { TypedUniforms } from '../../Helpers/uniforms.ts';
import type IDisposable from '../../Contracts/IDisposable.ts';

interface IBubbleUniformValues {
	uSize: number;
	uPixelRatio: number;
	uColor: Color;
}

/** Pooled exhale bubbles: a fixed buffer, no allocations after construction. */
export default class DiverBubbles extends Points<BufferGeometry, ShaderMaterial> implements IDisposable {
	private static readonly COUNT = 160;
	private static readonly LIFETIME = 7;

	private readonly _positions = new Float32Array(DiverBubbles.COUNT * 3);
	private readonly _scales = new Float32Array(DiverBubbles.COUNT);
	private readonly _alphas = new Float32Array(DiverBubbles.COUNT);
	private readonly _ages = new Float32Array(DiverBubbles.COUNT).fill(DiverBubbles.LIFETIME);
	private readonly _phases = new Float32Array(DiverBubbles.COUNT);
	private readonly _uniforms: TypedUniforms<IBubbleUniformValues>;
	private _cursor = 0;
	private _isActive = false;

	constructor() {
		const geometry = new BufferGeometry();
		const uniforms: TypedUniforms<IBubbleUniformValues> = {
			uSize: { value: 60 },
			uPixelRatio: { value: 1 },
			uColor: { value: new Color('#dffaff') }
		};

		super(
			geometry,
			new ShaderMaterial({
				uniforms,
				vertexShader,
				fragmentShader,
				transparent: true,
				depthWrite: false,
				blending: AdditiveBlending
			})
		);

		geometry.setAttribute('position', new BufferAttribute(this._positions, 3));
		geometry.setAttribute('aScale', new BufferAttribute(this._scales, 1));
		geometry.setAttribute('aAlpha', new BufferAttribute(this._alphas, 1));

		this._uniforms = uniforms;
		this.frustumCulled = false;
	}

	public set pixelRatio(value: number) {
		this._uniforms.uPixelRatio.value = value;
	}

	/** Releases a cluster of bubbles at a point. */
	public burst(origin: Vector3, count: number): void {
		for (let i = 0; i < count; i++) {
			const index = this._cursor;
			this._cursor = (this._cursor + 1) % DiverBubbles.COUNT;

			this._positions[index * 3] = origin.x + (Math.random() - 0.5) * 0.25;
			this._positions[index * 3 + 1] = origin.y + Math.random() * 0.2;
			this._positions[index * 3 + 2] = origin.z + (Math.random() - 0.5) * 0.25;
			this._scales[index] = 0.25 + Math.random() * 0.6;
			this._ages[index] = -Math.random() * 0.35;
			this._phases[index] = Math.random() * Math.PI * 2;
		}

		this._isActive = true;
	}

	public update(delta: number): void {
		if (!this._isActive) {
			return;
		}

		let alive = 0;

		for (let i = 0; i < DiverBubbles.COUNT; i++) {
			const age = (this._ages[i] ?? DiverBubbles.LIFETIME) + delta;
			this._ages[i] = age;

			if (age >= DiverBubbles.LIFETIME || age < 0) {
				this._alphas[i] = 0;
				alive += age < 0 ? 1 : 0;

				continue;
			}

			const phase = this._phases[i] ?? 0;
			const y = i * 3 + 1;
			const rise = (1.1 + (this._scales[i] ?? 0) * 1.4) * delta;

			this._positions[i * 3] = (this._positions[i * 3] ?? 0) + Math.sin(age * 5 + phase) * 0.6 * delta;
			this._positions[y] = Math.min(SURFACE_Y, (this._positions[y] ?? 0) + rise);
			this._positions[i * 3 + 2] = (this._positions[i * 3 + 2] ?? 0) + Math.cos(age * 4 + phase) * 0.6 * delta;
			this._scales[i] = (this._scales[i] ?? 0) + delta * 0.08;
			this._alphas[i] =
				Math.min(1, age * 6) * (1 - age / DiverBubbles.LIFETIME) * ((this._positions[y] ?? 0) >= SURFACE_Y ? 0 : 1);
			alive++;
		}

		this._isActive = alive > 0;
		this.geometry.getAttribute('position').needsUpdate = true;
		this.geometry.getAttribute('aScale').needsUpdate = true;
		this.geometry.getAttribute('aAlpha').needsUpdate = true;
	}

	public override dispose(): void {
		this.geometry.dispose();
		this.material.dispose();
		super.dispose();
	}
}
