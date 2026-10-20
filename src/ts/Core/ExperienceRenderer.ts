import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';
import type IResizable from '../Contracts/IResizable.ts';
import type IViewportSize from '../Contracts/IViewportSize.ts';

export default class ExperienceRenderer extends WebGLRenderer implements IResizable {
	constructor(canvas: HTMLCanvasElement) {
		super({
			canvas,
			antialias: false,
			powerPreference: 'high-performance',
			stencil: false,
			depth: true
		});

		this.outputColorSpace = SRGBColorSpace;
		this.toneMapping = ACESFilmicToneMapping;
		this.toneMappingExposure = 1;
		// Underwater there are no hard shadows; caustics do the work instead
		this.shadowMap.enabled = false;
	}

	public resize(size: IViewportSize): void {
		this.setPixelRatio(size.pixelRatio);
		this.setSize(size.width, size.height, false);
	}
}
