// What the diver chose, kept in this browser between visits. Storage may be unavailable (private
// mode, blocked site data): then every read falls back to its default and writes are dropped.
const PREFIX = 'undertow:';

export const QUALITY_MODES = ['auto', 'high', 'low'] as const;
export type QualityMode = (typeof QUALITY_MODES)[number];

/** Captions always, only while the sound is off, or never. */
export const CAPTION_MODES = ['always', 'muted', 'never'] as const;
export type CaptionMode = (typeof CAPTION_MODES)[number];

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
	captions: (): CaptionMode => choice('captions', CAPTION_MODES, 'always'),
	setCaptions: (mode: CaptionMode): void => write('captions', mode),
	/** Dives followed all the way to the end. */
	dives: (): number => Number(read('dives')) || 0,
	addDive: (): void => write('dives', String(preferences.dives() + 1)),
	hasSeenControls: (): boolean => read('controls-seen') === '1',
	rememberControlsSeen: (): void => write('controls-seen', '1')
};
