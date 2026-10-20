export const InputAction = {
	FORWARD: 'forward',
	BACK: 'back',
	TURN_LEFT: 'turnLeft',
	TURN_RIGHT: 'turnRight',
	ASCEND: 'ascend',
	DESCEND: 'descend',
	SPRINT: 'sprint',
	FLASHLIGHT: 'flashlight',
	TOGGLE_MUTE: 'toggleMute'
} as const;

export type InputAction = (typeof InputAction)[keyof typeof InputAction];
