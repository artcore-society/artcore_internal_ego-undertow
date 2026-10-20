import { InputAction } from '../Enums/InputAction.ts';
import type IDisposable from '../Contracts/IDisposable.ts';

const KEY_BINDINGS: Readonly<Record<string, InputAction>> = {
	KeyW: InputAction.FORWARD,
	ArrowUp: InputAction.FORWARD,
	KeyS: InputAction.BACK,
	ArrowDown: InputAction.BACK,
	KeyA: InputAction.TURN_LEFT,
	ArrowLeft: InputAction.TURN_LEFT,
	KeyD: InputAction.TURN_RIGHT,
	ArrowRight: InputAction.TURN_RIGHT,
	Space: InputAction.ASCEND,
	KeyE: InputAction.ASCEND,
	KeyC: InputAction.DESCEND,
	KeyQ: InputAction.DESCEND,
	ControlLeft: InputAction.DESCEND,
	ShiftLeft: InputAction.SPRINT,
	ShiftRight: InputAction.SPRINT,
	KeyF: InputAction.FLASHLIGHT,
	KeyM: InputAction.TOGGLE_MUTE
};

type ActionListener = () => void;

/**
 * Translates raw keyboard / touch input into semantic actions and analogue axes.
 * Uses physical key codes, so ZQSD on AZERTY works out of the box.
 */
export default class InputService implements IDisposable {
	private readonly _held = new Set<InputAction>();
	private readonly _pressListeners = new Map<InputAction, Set<ActionListener>>();
	private readonly _target: HTMLElement;
	private _touchTurn = 0;
	private _touchForward = 0;
	private _touchVertical = 0;
	private _activePointerId: number | null = null;

	constructor(target: HTMLElement) {
		this._target = target;

		window.addEventListener('keydown', this.onKeyDown);
		window.addEventListener('keyup', this.onKeyUp);
		window.addEventListener('blur', this.onBlur);
		target.addEventListener('pointerdown', this.onPointerDown);
		target.addEventListener('pointermove', this.onPointerMove);
		target.addEventListener('pointerup', this.onPointerUp);
		target.addEventListener('pointercancel', this.onPointerUp);
	}

	public get forward(): number {
		return this.axis(InputAction.FORWARD, InputAction.BACK, this._touchForward);
	}

	public get turn(): number {
		return this.axis(InputAction.TURN_LEFT, InputAction.TURN_RIGHT, this._touchTurn);
	}

	public get vertical(): number {
		return this.axis(InputAction.ASCEND, InputAction.DESCEND, this._touchVertical);
	}

	public isHeld(action: InputAction): boolean {
		return this._held.has(action);
	}

	public onPress(action: InputAction, listener: ActionListener): () => void {
		let listeners = this._pressListeners.get(action);

		if (!listeners) {
			listeners = new Set();
			this._pressListeners.set(action, listeners);
		}

		listeners.add(listener);

		return () => listeners.delete(listener);
	}

	public dispose(): void {
		window.removeEventListener('keydown', this.onKeyDown);
		window.removeEventListener('keyup', this.onKeyUp);
		window.removeEventListener('blur', this.onBlur);
		this._target.removeEventListener('pointerdown', this.onPointerDown);
		this._target.removeEventListener('pointermove', this.onPointerMove);
		this._target.removeEventListener('pointerup', this.onPointerUp);
		this._target.removeEventListener('pointercancel', this.onPointerUp);
		this._pressListeners.clear();
		this._held.clear();
	}

	private axis(positive: InputAction, negative: InputAction, touch: number): number {
		const keyboard = (this.isHeld(positive) ? 1 : 0) - (this.isHeld(negative) ? 1 : 0);

		return keyboard !== 0 ? keyboard : touch;
	}

	private readonly onKeyDown = (event: KeyboardEvent): void => {
		const action = KEY_BINDINGS[event.code];

		if (!action || InputService.isTyping(event)) {
			return;
		}

		event.preventDefault();

		if (!event.repeat) {
			this._pressListeners.get(action)?.forEach((listener) => listener());
		}

		this._held.add(action);
	};

	private readonly onKeyUp = (event: KeyboardEvent): void => {
		const action = KEY_BINDINGS[event.code];

		if (action && !InputService.isTyping(event)) {
			// A focused button would otherwise "click" on Space/Enter release and fire its own action
			event.preventDefault();
			this._held.delete(action);
		}
	};

	/** Keys typed into a text field belong to the field, not the diver. */
	private static isTyping(event: KeyboardEvent): boolean {
		const target = event.target;

		return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
	}

	private readonly onBlur = (): void => {
		this._held.clear();
		this.resetTouch();
	};

	private readonly onPointerDown = (event: PointerEvent): void => {
		if (event.pointerType === 'mouse' || this._activePointerId !== null) {
			return;
		}

		this._activePointerId = event.pointerId;
		this.applyTouch(event);
	};

	private readonly onPointerMove = (event: PointerEvent): void => {
		if (event.pointerId === this._activePointerId) {
			this.applyTouch(event);
		}
	};

	private readonly onPointerUp = (event: PointerEvent): void => {
		if (event.pointerId === this._activePointerId) {
			this.resetTouch();
		}
	};

	/** Touch: holding swims forward, horizontal offset turns, top and bottom bands ascend and descend. */
	private applyTouch(event: PointerEvent): void {
		const bounds = this._target.getBoundingClientRect();
		const x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
		const y = (event.clientY - bounds.top) / bounds.height;

		this._touchTurn = Math.max(-1, Math.min(1, -x * 1.6));
		this._touchForward = 1;
		this._touchVertical = y < 0.3 ? 1 : y > 0.75 ? -1 : 0;
	}

	private resetTouch(): void {
		this._activePointerId = null;
		this._touchTurn = 0;
		this._touchForward = 0;
		this._touchVertical = 0;
	}
}
