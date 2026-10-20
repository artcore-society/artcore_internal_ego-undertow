/** Models in public/assets/models (built by `yarn assets:build`). */
export const MODEL_NAMES = [
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
	'bronze_whale_statue',
	'barramundi_fish',
	'humpback_whale',
	'diploria_labyrinthiformis',
	'acropora_cervicornis_detail_view',
	'pocillopora_damicornis_caespitosa',
	'soft_coral_set',
	'fan_coral_cluster_low',
	'blue_sea_anemone_l',
	'claret_tall_seaweed',
	'claret_wiggle_seaweed',
	'sea_turtle',
	'old_ruined_column',
	'half_temple_of_apollon_portara',
	'elder_stones'
] as const;

export type ModelName = (typeof MODEL_NAMES)[number];

/** Texture sets in public/assets/textures. */
export const TEXTURE_SETS = ['coast_sand_01', 'rock_face', 'coral_ground_02', 'large_sandstone_blocks_01'] as const;

export type TextureSet = (typeof TEXTURE_SETS)[number];

export const TEXTURE_MAPS = ['diffuse', 'nor_gl', 'rough'] as const;

export type TextureMap = (typeof TEXTURE_MAPS)[number];

export const ASSET_BASE = `${import.meta.env.BASE_URL}assets`;
