import { InputAction } from '../../Enums/InputAction.ts';
import type InputService from '../../Services/InputService.ts';
import type IDiverIntent from './IDiverIntent.ts';

/** Turns input into swim intent; disabled during cinematics and blackouts. */
export default class DiverController implements IDiverIntent {
	private static readonly IDLE: IDiverIntent = { forward: 0, turn: 0, vertical: 0, sprint: false };

	public enabled = false;

	private readonly _input: InputService;

	constructor(input: InputService) {
		this._input = input;
	}

	public get forward(): number {
		return this.enabled ? this._input.forward : DiverController.IDLE.forward;
	}

	public get turn(): number {
		return this.enabled ? this._input.turn : DiverController.IDLE.turn;
	}

	public get vertical(): number {
		return this.enabled ? this._input.vertical : DiverController.IDLE.vertical;
	}

	public get sprint(): boolean {
		return this.enabled && this._input.isHeld(InputAction.SPRINT) && this._input.forward > 0;
	}
}
