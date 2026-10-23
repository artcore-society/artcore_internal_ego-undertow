import type IDisposable from '../Contracts/IDisposable.ts';
import type IResizable from '../Contracts/IResizable.ts';
import type IViewportSize from '../Contracts/IViewportSize.ts';

/** Observes the canvas container and broadcasts size changes to resizable systems. */
export default class Viewport implements IDisposable, IViewportSize {
	/** Retina at 2× quadruples the fragment work of every pass; 1.5 is the sweet spot underwater. */
	private static readonly MAX_PIXEL_RATIO = 1.5;

	private readonly _observer: ResizeObserver;
	private readonly _container: HTMLElement;
	private readonly _subscribers = new Set<IResizable>();
	private _width = 1;
	private _height = 1;
	private _quality = 1;
	private _maxPixelRatio = Viewport.MAX_PIXEL_RATIO;

	constructor(container: HTMLElement) {
		this._container = container;
		this._observer = new ResizeObserver(() => this.measure());
		this._observer.observe(container);
		this.measure();
	}

	public get width(): number {
		return this._width;
	}

	public get height(): number {
		return this._height;
	}

	public get pixelRatio(): number {
		return Math.min(window.devicePixelRatio, this._maxPixelRatio) * this._quality;
	}

	/** Highest pixel ratio rendered (the high quality setting allows a retina screen's full 2×). */
	public set maxPixelRatio(value: number) {
		if (value !== this._maxPixelRatio) {
			this._maxPixelRatio = value;
			this._subscribers.forEach((subscriber) => subscriber.resize(this));
		}
	}

	/** Render resolution scale (0..1), lowered by AdaptiveQuality when frames run long. */
	public set quality(value: number) {
		if (value !== this._quality) {
			this._quality = value;
			this._subscribers.forEach((subscriber) => subscriber.resize(this));
		}
	}

	public get aspect(): number {
		return this._width / this._height;
	}

	public subscribe(subscriber: IResizable): void {
		this._subscribers.add(subscriber);
		subscriber.resize(this);
	}

	public dispose(): void {
		this._observer.disconnect();
		this._subscribers.clear();
	}

	private measure(): void {
		const bounds = this._container.getBoundingClientRect();
		this._width = Math.max(1, Math.floor(bounds.width));
		this._height = Math.max(1, Math.floor(bounds.height));
		this._subscribers.forEach((subscriber) => subscriber.resize(this));
	}
}
