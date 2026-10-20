function hash(x: number, z: number): number {
	const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;

	return s - Math.floor(s);
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
	const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));

	return t * t * (3 - 2 * t);
}

/** Smooth 2D value noise in -1..1. */
export function valueNoise(x: number, z: number): number {
	const ix = Math.floor(x);
	const iz = Math.floor(z);
	const fx = x - ix;
	const fz = z - iz;
	const ux = fx * fx * (3 - 2 * fx);
	const uz = fz * fz * (3 - 2 * fz);

	const a = hash(ix, iz);
	const b = hash(ix + 1, iz);
	const c = hash(ix, iz + 1);
	const d = hash(ix + 1, iz + 1);

	return (a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz) * 2 - 1;
}

/** Fractal value noise, roughly -1..1. */
export function fbm(x: number, z: number, octaves = 3): number {
	let sum = 0;
	let amplitude = 0.5;
	let frequency = 1;
	let norm = 0;

	for (let i = 0; i < octaves; i++) {
		sum += valueNoise(x * frequency, z * frequency) * amplitude;
		norm += amplitude;
		amplitude *= 0.5;
		frequency *= 2.03;
	}

	return sum / norm;
}
