// What the diver chose, kept in this browser between visits. Storage may be unavailable (private
// mode, blocked site data): then every read falls back to its default and writes are dropped.
const PREFIX = 'undertow:';

export const QUALITY_MODES = ['auto', 'high', 'low'] as const;
export type QualityMode = (typeof QUALITY_MODES)[number];

function read(name: string): string | null {
	try {
		return localStorage.getItem(PREFIX + name);
	} catch {
		return null;
	}
}

function write(name: string, value: string): void {
	try {
		localStorage.setItem(PREFIX + name, value);
	} catch {
		// Not remembered; harmless
	}
}

function choice<TValue extends string>(name: string, allowed: readonly TValue[], fallback: TValue): TValue {
	const value = read(name);

	return allowed.find((option) => option === value) ?? fallback;
}

export const preferences = {
	quality: (): QualityMode => choice('quality', QUALITY_MODES, 'auto'),
	setQuality: (mode: QualityMode): void => write('quality', mode),
	/** Captions on unless switched off ('never' is how an earlier version stored off). */
	hasCaptions: (): boolean => !['off', 'never'].includes(read('captions') ?? ''),
	setCaptions: (isOn: boolean): void => write('captions', isOn ? 'on' : 'off'),
	/** Dives followed all the way to the end. */
	dives: (): number => Number(read('dives')) || 0,
	addDive: (): void => write('dives', String(preferences.dives() + 1)),
	hasSeenControls: (): boolean => read('controls-seen') === '1',
	rememberControlsSeen: (): void => write('controls-seen', '1')
};
