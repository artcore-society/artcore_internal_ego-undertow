import type IDisposable from '../Contracts/IDisposable.ts';

type KeyListener = () => void;

/**
 * Wheel, touch and keyboard into one "scroll" amount, in journey units.
 * Navigation keys use physical codes and shortcuts use the typed character, so it works the same on
 * QWERTY and AZERTY: Z/W (same key) or ↓ dives, S or ↑ goes back, and "M" is M wherever it sits.
 */
export default class ScrollInput implements IDisposable {
	/** Screen heights of scrolling for the whole journey. */
	private static readonly JOURNEY_SCREENS = 60;
	private static readonly KEY_STEP = 0.12;

	public enabled = false;

	private readonly _target: HTMLElement;
	private readonly _shortcuts = new Map<string, KeyListener>();
	private _pending = 0;
	private _touchY: number | null = null;

	constructor(target: HTMLElement) {
		this._target = target;

		// Not passive: the journey owns scrolling, so the page itself must never move
		window.addEventListener('wheel', this.onWheel, { passive: false });
		window.addEventListener('keydown', this.onKeyDown);
		target.addEventListener('touchstart', this.onTouchStart, { passive: true });
		target.addEventListener('touchmove', this.onTouchMove, { passive: false });
		target.addEventListener('touchend', this.onTouchEnd);
	}

	/** Registers a shortcut by its typed character (case-insensitive). */
	public onShortcut(key: string, listener: KeyListener): () => void {
		this._shortcuts.set(key.toLowerCase(), listener);

		return () => this._shortcuts.delete(key.toLowerCase());
	}

	/** Journey progress scrolled since the last call. */
	public consume(): number {
		const amount = this._pending;
		this._pending = 0;

		return amount;
	}

	public dispose(): void {
		window.removeEventListener('wheel', this.onWheel);
		window.removeEventListener('keydown', this.onKeyDown);
		this._target.removeEventListener('touchstart', this.onTouchStart);
		this._target.removeEventListener('touchmove', this.onTouchMove);
		this._target.removeEventListener('touchend', this.onTouchEnd);
		this._shortcuts.clear();
	}

	private push(pixels: number): void {
		if (this.enabled) {
			this._pending += pixels / (window.innerHeight * ScrollInput.JOURNEY_SCREENS);
		}
	}

	private readonly onWheel = (event: WheelEvent): void => {
		// Pinch-zoom on trackpads arrives as ctrl+wheel; leave that to the browser
		if (event.ctrlKey) {
			return;
		}

		event.preventDefault();

		// Lines and pages (Firefox, some mice) to pixels
		const scale = event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? window.innerHeight : 1;
		this.push(event.deltaY * scale);
	};

	private readonly onKeyDown = (event: KeyboardEvent): void => {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		const step = window.innerHeight * ScrollInput.KEY_STEP;

		switch (event.code) {
			// KeyW is the physical key labelled Z on AZERTY and W on QWERTY: "forward" either way
			case 'KeyW':
			case 'ArrowDown':
			case 'PageDown':
			case 'Space':
				// Holding a key repeats it: a steady glide down
				this.push(event.code === 'PageDown' ? step * 4 : step);
				event.preventDefault();

				return;
			case 'KeyS':
			case 'ArrowUp':
			case 'PageUp':
				this.push(event.code === 'PageUp' ? -step * 4 : -step);
				event.preventDefault();

				return;
			case 'Home':
			case 'End':
				event.preventDefault();

				return;
		}

		if (!event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey) {
			this._shortcuts.get(event.key.toLowerCase())?.();
		}
	};

	private readonly onTouchStart = (event: TouchEvent): void => {
		this._touchY = event.touches[0]?.clientY ?? null;
	};

	private readonly onTouchMove = (event: TouchEvent): void => {
		const y = event.touches[0]?.clientY;

		event.preventDefault();

		if (this._touchY === null || y === undefined) {
			return;
		}

		this.push((this._touchY - y) * 2.5);
		this._touchY = y;
	};

	private readonly onTouchEnd = (): void => {
		this._touchY = null;
	};
}
