import { HalfFloatType, Vector2, WebGLRenderTarget, type Camera, type Scene } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import UnderwaterPass from './UnderwaterPass.ts';
import { damp } from '../Helpers/math.ts';
import type ExperienceRenderer from '../Core/ExperienceRenderer.ts';
import type IDisposable from '../Contracts/IDisposable.ts';
import type IEnvironmentAware from '../Contracts/IEnvironmentAware.ts';
import type IEnvironmentState from '../Contracts/IEnvironmentState.ts';
import type IFrameContext from '../Contracts/IFrameContext.ts';
import type IResizable from '../Contracts/IResizable.ts';
import type IViewportSize from '../Contracts/IViewportSize.ts';

/**
 * HDR render → bloom (glow of shards, jellyfish, Atlantis) → underwater lens → tone mapping & sRGB.
 * No MSAA and no separate AA pass: the lens wobble and fog soften edges for free.
 */
export default class PostProcessing implements IResizable, IEnvironmentAware, IDisposable {
	private readonly _renderer: ExperienceRenderer;
	private readonly _composer: EffectComposer;
	private readonly _bloom = new UnrealBloomPass(new Vector2(1, 1), 0.5, 0.6, 1);
	private readonly _underwater = new UnderwaterPass();
	private _speed = 0;
	private _hypoxia = 0;
	private _air = 0;
	private _isAbove = false;
	private _wet = 0;
	private _sheet = 1;
	/** Bloom's resolution relative to the frame. */
	private _bloomScale = 0.5;
	private _size: IViewportSize | null = null;

	constructor(renderer: ExperienceRenderer, scene: Scene, camera: Camera) {
		this._renderer = renderer;
		this._composer = new EffectComposer(renderer, new WebGLRenderTarget(1, 1, { type: HalfFloatType }));
		this._composer.addPass(new RenderPass(scene, camera));
		this._composer.addPass(this._bloom);
		this._composer.addPass(this._underwater);
		this._composer.addPass(new OutputPass());
	}

	public resize(size: IViewportSize): void {
		this._size = size;
		this._composer.setPixelRatio(size.pixelRatio);
		this._composer.setSize(size.width, size.height);
		this.sizeBloom();
		this._underwater.setResolution(size.width * size.pixelRatio, size.height * size.pixelRatio);
	}

	/** Full-resolution bloom (the high quality setting): crisper glows, at a cost. */
	public set isBloomSharp(value: boolean) {
		this._bloomScale = value ? 1 : 0.5;
		this.sizeBloom();
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		// Out in the open the sun is the only thing that should glow
		this._bloom.strength = state.bloomStrength * (1 - this._air * 0.55);
		this._renderer.toneMappingExposure = state.exposure;
		this._underwater.tint.copy(state.waterColor);
	}

	/** 0..1 how strongly the head lamp scatters in the water. */
	public set lamp(value: number) {
		this._underwater.lamp = value;
	}

	/** 0..1 the weight of the water: the view narrows and greys. */
	public set pressure(value: number) {
		this._underwater.pressure = value;
	}

	/** Where the head lamp points, -1..1 across and down the screen. */
	public aimLamp(x: number, y: number): void {
		this._underwater.setBeam(0.53 + x * 0.3, 0.44 - y * 0.25);
	}

	/** Bloom is the costliest pass: the low quality setting goes without it. */
	public set isBloomEnabled(value: boolean) {
		this._bloom.enabled = value;
	}

	/** Whether the camera is above the water. */
	public set air(isAbove: boolean) {
		this._isAbove = isAbove;
	}

	/** The camera has just broken the surface (or slipped back under): water runs off the mask. */
	public splash(isAbove: boolean): void {
		this._wet = isAbove ? 1 : 0;
		this._sheet = isAbove ? 0 : 1;
	}

	/** 0..1 how black the screen is (the ending fades out). */
	public set fade(value: number) {
		this._underwater.fade = value;
	}

	/**
	 * @param motion 0..1 how fast the journey is moving (fringing grows with speed)
	 * @param dream 0..1 the world swims and desaturates (the voice of the deep)
	 */
	public render(motion: number, dream: number, frame: IFrameContext): void {
		this._speed = damp(this._speed, motion, 3, frame.delta);
		this._hypoxia = damp(this._hypoxia, dream, 1.5, frame.delta);
		this._underwater.speed = this._speed;
		this._underwater.hypoxia = this._hypoxia;
		this._air = damp(this._air, this._isAbove ? 1 : 0, 4, frame.delta);
		this._wet = Math.max(0, this._wet - frame.delta / 3.5);
		this._sheet = Math.min(1, this._sheet + frame.delta / 0.9);
		this._underwater.sheet = this._sheet;
		this._underwater.air = this._air;
		this._underwater.wet = this._wet;
		this._underwater.time = frame.elapsed;
		this._composer.render(frame.delta);
	}

	/** Bloom is soft by nature: at half resolution the difference is slight and it saves most of its cost. */
	private sizeBloom(): void {
		if (this._size) {
			const { width, height, pixelRatio } = this._size;
			this._bloom.setSize(width * pixelRatio * this._bloomScale, height * pixelRatio * this._bloomScale);
		}
	}

	public dispose(): void {
		this._composer.dispose();
		this._bloom.dispose();
		this._underwater.dispose();
	}
}
