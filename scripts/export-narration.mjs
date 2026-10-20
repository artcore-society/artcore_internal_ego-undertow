/**
 * Writes the voice script (for recording, e.g. in ElevenLabs) from src/ts/Journey/narration.ts.
 * Usage: `yarn narration:export [output directory]` (defaults to the current directory).
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { NARRATION, VOICES } from '../src/ts/Journey/narration.ts';

const outDir = process.argv[2] ?? '.';
const speakers = Object.keys(VOICES);

const markdown = [
	'# Undertow — voice script',
	'',
	'Save each line as `public/assets/voice/<file>.mp3` (mono, 44.1 kHz, about 128 kbps). The experience plays a',
	'file when it exists and falls back to on-screen captions only.',
	'',
	'Record every line clean and dry: radio filter (Kai) and reverb (The Deep) are added in the experience.',
	'',
	'## Voices',
	'',
	...speakers.map((speaker) => `- **${speaker}** — ${VOICES[speaker]}`),
	'',
	...speakers.flatMap((speaker) => [
		`## ${speaker}`,
		'',
		...NARRATION.filter((line) => line.speaker === speaker).map((line) => `- \`${line.id}.mp3\` — ${line.text}`),
		''
	]),
	'## In story order',
	'',
	...NARRATION.map((line) => `${line.id.slice(0, 2)}. **${line.speaker}:** ${line.text}`),
	''
].join('\n');

const csv = [
	'file,speaker,text',
	...NARRATION.map((line) => `${line.id}.mp3,${line.speaker},"${line.text.replaceAll('"', '""')}"`)
].join('\n');

await writeFile(join(outDir, 'undertow-voice-script.md'), markdown);
await writeFile(join(outDir, 'undertow-voice-script.csv'), `${csv}\n`);
console.log(`Wrote undertow-voice-script.md and .csv to ${outDir}`);
