/**
 * Downloads the CC0 source assets into assets-src/ (gitignored). Run once: `yarn assets:fetch`.
 * Then `yarn assets:build` compresses them into public/assets.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { DIRECT_MODELS, POLY_HAVEN_MODELS, POLY_HAVEN_TEXTURES, SOURCE_DIR, TEXTURE_MAPS } from './assets.config.mjs';

const HEADERS = { 'User-Agent': 'undertow-asset-fetch/1.0' };
const RESOLUTION = '1k';

async function exists(path) {
	try {
		await access(path);

		return true;
	} catch {
		return false;
	}
}

async function download(url, path) {
	if (await exists(path)) {
		return;
	}

	const response = await fetch(url, { headers: HEADERS });

	if (!response.ok) {
		throw new Error(`${response.status} ${url}`);
	}

	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, Buffer.from(await response.arrayBuffer()));
	console.log(`  ↓ ${path}`);
}

async function files(asset) {
	const response = await fetch(`https://api.polyhaven.com/files/${asset}`, { headers: HEADERS });

	return response.json();
}

for (const asset of POLY_HAVEN_MODELS) {
	console.log(`model ${asset}`);
	const gltf = (await files(asset)).gltf[RESOLUTION].gltf;
	const folder = join(SOURCE_DIR, 'models', asset);

	await download(gltf.url, join(folder, `${asset}.gltf`));

	for (const [relative, include] of Object.entries(gltf.include ?? {})) {
		await download(include.url, join(folder, relative));
	}
}

for (const asset of POLY_HAVEN_TEXTURES) {
	console.log(`texture ${asset}`);
	const sets = await files(asset);

	for (const map of TEXTURE_MAPS) {
		await download(sets[map][RESOLUTION].jpg.url, join(SOURCE_DIR, 'textures', asset, `${map}.jpg`));
	}
}

for (const [name, url] of Object.entries(DIRECT_MODELS)) {
	console.log(`model ${name}`);
	await download(url, join(SOURCE_DIR, 'models', name, `${name}.glb`));
}
