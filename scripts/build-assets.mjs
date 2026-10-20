/**
 * Compresses assets-src/ into public/assets/: meshes welded, simplified and meshopt-compressed,
 * textures resized and re-encoded as WebP. Run after `yarn assets:fetch`: `yarn assets:build`.
 */
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, resample, textureCompress, meshopt, flatten, join as joinMeshes } from '@gltf-transform/functions';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import { OUTPUT_DIR, SOURCE_DIR } from './assets.config.mjs';

/**
 * Per-model budget: how much geometry to keep (ratio, capped by the allowed error) and how large its
 * textures may be. Anything instanced by the dozen (rocks, shells) is cut hard: the normal maps carry
 * the surface detail, the silhouette only needs a few thousand triangles.
 */
const MODEL_SETTINGS = {
	dutch_ship_medium: { ratio: 0.5, textureSize: 1024 },
	rock_moss_set_01: { ratio: 0.1, error: 0.03, textureSize: 1024 },
	rock_moss_set_02: { ratio: 0.1, error: 0.03, textureSize: 1024 },
	boulder_01: { ratio: 0.04, error: 0.05, textureSize: 512 },
	ocean_buoy: { ratio: 0.6, textureSize: 512 },
	vintage_radio_transceiver: { ratio: 0.5, textureSize: 512 },
	lambis_shell: { ratio: 0.08, error: 0.05, textureSize: 256 },
	cannon_01: { ratio: 0.5, textureSize: 512 },
	gothic_statue: { ratio: 0.35, textureSize: 1024 },
	lion_head: { ratio: 0.4, textureSize: 512 },
	horse_statue_01: { ratio: 0.5, textureSize: 512 },
	marble_bust_01: { ratio: 0.5, textureSize: 512 },
	bronze_whale_statue: { ratio: 0.5, textureSize: 512 },
	barramundi_fish: { ratio: 0.25, error: 0.02, textureSize: 512 },
	humpback_whale: { ratio: 1, textureSize: 1024 },
	// Reef life (Smithsonian coral scans are 100k triangles each: cut to a few thousand)
	diploria_labyrinthiformis: { ratio: 0.03, error: 0.05, textureSize: 512 },
	acropora_cervicornis_detail_view: { ratio: 0.04, error: 0.05, textureSize: 512 },
	pocillopora_damicornis_caespitosa: { ratio: 0.03, error: 0.05, textureSize: 512 },
	soft_coral_set: { ratio: 0.3, error: 0.03, textureSize: 512 },
	fan_coral_cluster_low: { ratio: 1, textureSize: 512 },
	blue_sea_anemone_l: { ratio: 0.12, error: 0.05, textureSize: 512 },
	claret_tall_seaweed: { ratio: 0.08, error: 0.05, textureSize: 512 },
	claret_wiggle_seaweed: { ratio: 0.15, error: 0.05, textureSize: 512 },
	sea_turtle: { ratio: 1, textureSize: 1024, animated: true },
	// Temple and Atlantis
	old_ruined_column: { ratio: 0.3, error: 0.02, textureSize: 1024 },
	half_temple_of_apollon_portara: { ratio: 0.07, error: 0.02, textureSize: 1024 },
	elder_stones: { ratio: 1, textureSize: 1024 },
	// Atlantis's skyline: only the buildings, without the scenery they were modelled in
	// Thousands of minimal pieces (column flutes, tiles): ~58k triangles is its floor, one instance only
	greek_style_ancient_temple: {
		ratio: 0.25,
		error: 0.02,
		textureSize: 256,
		isUntextured: true,
		materials: ['Plaster17_3K', 'plaster-color', 'plaster-color-wall', 'roof-tiles', 'roof-center', 'ornament-facade', 'tiles-ornament']
	},
	greek_tholos: { ratio: 0.3, error: 0.01, textureSize: 512, isUntextured: true, materials: ['Column', 'material', 'Base'] },
	roman_greco_temple_aged: { ratio: 0.6, error: 0.01, textureSize: 512, isUntextured: true }
};

/** Texture sets: colour at full size, data maps smaller (underwater haze hides their detail). */
const TEXTURE_SETTINGS = {
	Diffuse: { size: 1024, quality: 82 },
	nor_gl: { size: 1024, quality: 90 },
	Rough: { size: 512, quality: 75 }
};

const io = new NodeIO()
	.registerExtensions(ALL_EXTENSIONS)
	.registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptEncoder });

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

async function size(path) {
	return ((await stat(path)).size / 1e6).toFixed(2);
}

/** Drops every primitive whose material isn't listed: scenery that came with a model. */
function keepMaterials(names) {
	return (document) => {
		for (const mesh of document.getRoot().listMeshes()) {
			for (const primitive of mesh.listPrimitives()) {
				if (!names.includes(primitive.getMaterial()?.getName() ?? '')) {
					primitive.dispose();
				}
			}
		}
	};
}

/**
 * Drops UVs, tangents and textures: for models that are textured in the scene instead (triplanar
 * stone). UV seams also stop the simplifier from merging anything, so this is what lets it cut them.
 */
function untextured() {
	return (document) => {
		for (const primitive of document.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives())) {
			for (const semantic of primitive.listSemantics()) {
				if (semantic.startsWith('TEXCOORD_') || semantic === 'TANGENT') {
					primitive.setAttribute(semantic, null);
				}
			}
		}

		document.getRoot().listTextures().forEach((texture) => texture.dispose());
	};
}

/** `yarn assets:build [model ...]`: only the named models (and no textures), or everything. */
const only = process.argv.slice(2);

async function buildModels() {
	const outDir = join(OUTPUT_DIR, 'models');
	await mkdir(outDir, { recursive: true });

	for (const [name, settings] of Object.entries(MODEL_SETTINGS)) {
		if (only.length && !only.includes(name)) {
			continue;
		}

		const folder = join(SOURCE_DIR, 'models', name);
		const source = (await readdir(folder)).find((file) => file.endsWith('.gltf') || file.endsWith('.glb'));
		const document = await io.read(join(folder, source));

		// Rigged models keep their hierarchy and geometry: flattening or simplifying breaks the skin
		const geometry = settings.animated
			? []
			: [flatten(), joinMeshes(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: settings.ratio, error: settings.error ?? 0.001 })];

		await document.transform(
			...(settings.materials ? [keepMaterials(settings.materials)] : []),
			...(settings.isUntextured ? [untextured()] : []),
			dedup(),
			...geometry,
			resample(),
			prune(),
			textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [settings.textureSize, settings.textureSize], quality: 85 }),
			meshopt({ encoder: MeshoptEncoder, level: 'medium' })
		);

		document.createExtension(EXTMeshoptCompression).setRequired(true);

		const output = join(outDir, `${name}.glb`);
		await io.write(output, document);
		console.log(`model   ${name.padEnd(28)} ${await size(output)} MB`);
	}
}

async function buildTextures() {
	const sourceDir = join(SOURCE_DIR, 'textures');

	for (const set of await readdir(sourceDir)) {
		const outDir = join(OUTPUT_DIR, 'textures', set);
		await mkdir(outDir, { recursive: true });

		for (const [map, settings] of Object.entries(TEXTURE_SETTINGS)) {
			const output = join(outDir, `${map.toLowerCase()}.webp`);

			await sharp(join(sourceDir, set, `${map}.jpg`))
				.resize(settings.size, settings.size)
				.webp({ quality: settings.quality })
				.toFile(output);
			console.log(`texture ${`${set}/${map}`.padEnd(28)} ${await size(output)} MB`);
		}
	}
}

await buildModels();

if (!only.length) {
	await buildTextures();
}
