/**
 * Every third-party asset in the project. Poly Haven and Khronos assets are CC0; the hand-downloaded
 * Sketchfab models are CC-BY (see MANUAL_MODELS and CREDITS.md).
 */
export const POLY_HAVEN_MODELS = [
	'dutch_ship_medium',
	'rock_moss_set_01',
	'rock_moss_set_02',
	'boulder_01',
	'ocean_buoy',
	'vintage_radio_transceiver',
	'lambis_shell',
	'cannon_01',
	'gothic_statue',
	'lion_head',
	'horse_statue_01',
	'marble_bust_01',
	'bronze_whale_statue'
];

export const POLY_HAVEN_TEXTURES = ['coast_sand_01', 'rock_face', 'coral_ground_02', 'large_sandstone_blocks_01'];

/** Texture maps fetched per texture set (Poly Haven names). */
export const TEXTURE_MAPS = ['Diffuse', 'nor_gl', 'Rough'];

export const DIRECT_MODELS = {
	barramundi_fish:
		'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BarramundiFish/glTF-Binary/BarramundiFish.glb'
};

/**
 * Models downloaded by hand (Sketchfab needs an account): unzip each into assets-src/models/<name>/.
 * CC-BY: credited in CREDITS.md and in the experience.
 */
export const MANUAL_MODELS = {
	humpback_whale: { url: 'https://sketchfab.com/3d-models/da07e3ff73914ff28d2b8cf9da794036', author: 'Allie2k', license: 'CC-BY-4.0' },
	diploria_labyrinthiformis: { url: 'https://sketchfab.com/3d-models/cbbf64f211f84a7cb62887fec11f54fe', author: 'Smithsonian', license: 'CC0' },
	acropora_cervicornis_detail_view: { url: 'https://sketchfab.com/3d-models/addc8ad93ace4e999085d6f8151cd694', author: 'Smithsonian', license: 'CC0' },
	pocillopora_damicornis_caespitosa: { url: 'https://sketchfab.com/3d-models/662c5b9144334e678b871f1960c03392', author: 'Smithsonian', license: 'CC0' },
	soft_coral_set: { url: 'https://sketchfab.com/3d-models/256355f15fcb4095af17b75ae572bff0', author: 'Kanna-nakajima', license: 'CC-BY-4.0' },
	fan_coral_cluster_low: { url: 'https://sketchfab.com/3d-models/ee315b6063f8472ea4788a75098a2cb5', author: 'Valery.Li', license: 'CC-BY-4.0' },
	blue_sea_anemone_l: { url: 'https://sketchfab.com/3d-models/f2542a8681584d048e515c660e6866fe', author: 'stefanorivera', license: 'CC-BY-4.0' },
	claret_tall_seaweed: { url: 'https://sketchfab.com/3d-models/6a07131b52b34d8992861d3c3ba82a29', author: 'Blaret', license: 'CC-BY-4.0' },
	claret_wiggle_seaweed: { url: 'https://sketchfab.com/3d-models/3f11b36110704b38abafc624a8e99d9c', author: 'Blaret', license: 'CC-BY-4.0' },
	sea_turtle: { url: 'https://sketchfab.com/3d-models/23dcb315dea44f5082b020b04710bd31', author: 'Eloiart', license: 'CC-BY-4.0' },
	old_ruined_column: { url: 'https://sketchfab.com/3d-models/6d0f71e5b9f44505b90392e332f38b1e', author: 'bsishir (CadmiumCoffee)', license: 'CC-BY-4.0' },
	half_temple_of_apollon_portara: { url: 'https://sketchfab.com/3d-models/0d54b70cf8c842aaa7f7d6ac41d56cff', author: 'tsabou (Georgios Tsampounaris)', license: 'CC-BY-4.0' },
	elder_stones: { url: 'https://sketchfab.com/3d-models/aa44e2d042e44238acd25c1a5e95b22c', author: 'Cheyenne.Bockart', license: 'CC-BY-4.0' }
};

export const SOURCE_DIR = 'assets-src';
export const OUTPUT_DIR = 'public/assets';
