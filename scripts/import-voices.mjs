/**
 * Imports an ElevenLabs "Paragraphs ZIP" export into public/assets/voice/ as clean, final files.
 *
 * Studio renders paragraphs from one continuous take, so a paragraph file can end with a sliver of
 * the next one after a short pause. Each file is decoded with ffmpeg, cut at the end of its own line
 * (and its leading silence), faded out and re-encoded; then saved under its narration id.
 * Paragraph files (1_…, 2_…) must be in narration order.
 *
 * Usage: `yarn voices:import <extracted export directory>` (needs ffmpeg on the PATH)
 */
import { execFileSync } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { NARRATION } from '../src/ts/Journey/narration.ts';

const SAMPLE_RATE = 44100;
/** Analysis window, seconds. */
const WINDOW = 0.01;
/** RMS below this is silence. */
const SILENCE = 0.012;
/** A pause at least this long separates the line from what follows. */
const GAP = 0.14;
/** Sound after the last pause shorter than this is the next line bleeding in. */
const BLEED = 0.45;
/** Silence kept before the first word and after the last. */
const LEAD_IN = 0.05;
const TAIL = 0.08;
const FADE = 0.04;

const source = process.argv[2];

if (!source) {
	throw new Error('Usage: yarn voices:import <extracted export directory>');
}

function decode(file) {
	const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(SAMPLE_RATE), '-'], {
		maxBuffer: 1 << 28
	});

	return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
}

/** Per-window loudness: true where someone is speaking. */
function loudness(samples) {
	const size = Math.round(SAMPLE_RATE * WINDOW);
	const loud = [];

	for (let start = 0; start < samples.length; start += size) {
		const end = Math.min(samples.length, start + size);
		let sum = 0;

		for (let i = start; i < end; i++) {
			sum += samples[i] * samples[i];
		}

		loud.push(Math.sqrt(sum / (end - start)) > SILENCE);
	}

	return loud;
}

/** Start and end (seconds) of the line itself, without the next paragraph's bleed. */
function speech(samples) {
	const loud = loudness(samples);
	const duration = samples.length / SAMPLE_RATE;
	const first = loud.indexOf(true);
	const last = loud.lastIndexOf(true);

	if (first < 0) {
		return { start: 0, end: duration, bleed: 0 };
	}

	const gapWindows = Math.ceil(GAP / WINDOW);
	let quiet = 0;
	let burstStart = last;

	// Walk back over the final burst of sound to the pause before it
	for (let i = last; i >= 0 && quiet < gapWindows; i--) {
		if (loud[i]) {
			quiet = 0;
			burstStart = i;
		} else {
			quiet++;
		}
	}

	const burst = (last - burstStart + 1) * WINDOW;
	const isBleed = quiet >= gapWindows && burst < BLEED && burstStart > first;
	const speechEnd = isBleed ? (burstStart - quiet) * WINDOW : (last + 1) * WINDOW;

	return {
		start: Math.max(0, first * WINDOW - LEAD_IN),
		end: Math.min(duration, speechEnd + TAIL),
		bleed: isBleed ? burst : 0
	};
}

const files = (await readdir(source)).filter((file) => /^\d+_.*\.mp3$/.test(file));
const byIndex = new Map(files.map((file) => [Number.parseInt(file, 10), file]));
const target = 'public/assets/voice';

if (byIndex.size !== NARRATION.length) {
	throw new Error(`Expected ${NARRATION.length} paragraph files, found ${byIndex.size}`);
}

await mkdir(target, { recursive: true });

for (const [index, line] of NARRATION.entries()) {
	const file = byIndex.get(index + 1);

	if (!file) {
		throw new Error(`Missing paragraph ${index + 1} (${line.id})`);
	}

	const input = join(source, file);
	const samples = decode(input);
	const { start, end, bleed } = speech(samples);
	const length = end - start;

	execFileSync('ffmpeg', [
		'-v', 'error', '-y',
		'-ss', start.toFixed(3), '-t', length.toFixed(3), '-i', input,
		'-af', `afade=t=out:st=${(length - FADE).toFixed(3)}:d=${FADE}`,
		'-ac', '1', '-ar', String(SAMPLE_RATE), '-codec:a', 'libmp3lame', '-b:a', '112k',
		join(target, `${line.id}.mp3`)
	]);

	const note = bleed ? `cut ${Math.round(bleed * 1000)} ms of the next line` : 'clean';
	console.log(`${file.padEnd(18)} → ${`${line.id}.mp3`.padEnd(30)} ${length.toFixed(2)} s  ${note}`);
}
