import { HalfFloatType, Vector2, WebGLRenderTarget, type Camera, type Scene } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import UnderwaterPass from './UnderwaterPass.ts';
import { damp } from '../Helpers/math.ts';
import type ExperienceRenderer from '../Core/ExperienceRenderer.ts';
import type IDiverState from '../Contracts/IDiverState.ts';
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

	constructor(renderer: ExperienceRenderer, scene: Scene, camera: Camera) {
		this._renderer = renderer;
		this._composer = new EffectComposer(renderer, new WebGLRenderTarget(1, 1, { type: HalfFloatType }));
		this._composer.addPass(new RenderPass(scene, camera));
		this._composer.addPass(this._bloom);
		this._composer.addPass(this._underwater);
		this._composer.addPass(new OutputPass());
	}

	public resize(size: IViewportSize): void {
		this._composer.setPixelRatio(size.pixelRatio);
		this._composer.setSize(size.width, size.height);
		// Bloom is soft by nature: half its resolution is invisible and saves most of its cost
		this._bloom.setSize((size.width * size.pixelRatio) / 2, (size.height * size.pixelRatio) / 2);
		this._underwater.setResolution(size.width * size.pixelRatio, size.height * size.pixelRatio);
	}

	public applyEnvironment(state: Readonly<IEnvironmentState>): void {
		this._bloom.strength = state.bloomStrength;
		this._renderer.toneMappingExposure = state.exposure;
		this._underwater.tint.copy(state.waterColor);
	}

	/** 0..1 how black the screen is (blackout). */
	public set fade(value: number) {
		this._underwater.fade = value;
	}

	public render(diver: IDiverState, hypoxia: number, frame: IFrameContext): void {
		this._speed = damp(this._speed, diver.isSprinting ? diver.speedRatio : 0, 3, frame.delta);
		this._hypoxia = damp(this._hypoxia, hypoxia, 1.5, frame.delta);
		this._underwater.speed = this._speed;
		this._underwater.hypoxia = this._hypoxia;
		this._underwater.time = frame.elapsed;
		this._composer.render(frame.delta);
	}

	public dispose(): void {
		this._composer.dispose();
		this._bloom.dispose();
		this._underwater.dispose();
	}
}
