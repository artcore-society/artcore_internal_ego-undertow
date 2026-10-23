#include ../includes/caustics.glsl
#include ../includes/noise.glsl
#include ../includes/sunset.glsl
#include ../includes/bell.glsl

uniform float uTime;
uniform vec3 uWaterColor;
uniform vec3 uDownwellColor;
uniform vec3 uSunDirection;
// Where the sun sets once the storm has passed
uniform vec3 uSunset;
uniform float uFogDensity;
uniform float uBrightness;
uniform float uFlash;
// 0 = storm, 1 = the storm has passed: a calm sea at sunset
uniform float uCalm;
// Lightning: bolt direction in the sky (xz), its shape seed, where it hit the water (xz) and when
uniform vec2 uBoltDirection;
uniform float uBoltSeed;
uniform vec2 uImpact;
uniform float uImpactAge;

varying vec3 vWorld;

/**
 * A lightning bolt seen through Snell's window: a jagged line from high in the sky down to the
 * horizon (the window's rim), with a branch. `disk` is the refracted view on the sky disk.
 */
float bolt(vec2 disk) {
	vec2 along = uBoltDirection;
	vec2 across = vec2(-along.y, along.x);
	float rim = 0.74;
	float s = dot(disk, along) / rim;
	float lateral = dot(disk, across);

	float jag = simplex(vec2(s * 9.0, uBoltSeed)) * 0.035 + simplex(vec2(s * 31.0, uBoltSeed + 4.0)) * 0.012;
	float trunk = bell((lateral - jag) / 0.006) * smoothstep(0.25, 0.32, s) * (1.0 - smoothstep(0.96, 1.02, s));

	float forkS = s - 0.55;
	float fork = bell((lateral - jag - forkS * 0.35 - simplex(vec2(s * 23.0, uBoltSeed + 9.0)) * 0.01) / 0.004)
		* step(0.0, forkS) * (1.0 - smoothstep(0.25, 0.35, forkS));

	return trunk + fork * 0.7;
}

/**
 * Rain on the surface, seen from below: every cell (p in cells) a drop landing on its own beat, its
 * ring spreading and fading. Returns the ring's outward slope (xy) and its strength (z).
 */
vec3 raindrop(vec2 p) {
	vec2 cell = floor(p);
	float seed = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
	vec2 offset = fract(p) - 0.5 - (vec2(fract(seed * 13.3), fract(seed * 7.7)) - 0.5) * 0.5;
	float age = fract(uTime * 0.9 + seed);
	float spread = length(offset);
	float ring = bell((spread - age * 0.4) / 0.03) * (1.0 - age) * (1.0 - age);

	return vec3(offset / max(spread, 1e-3) * ring, ring);
}

/** Height of the surface waves; its gradient bends the view like refraction does. */
float waves(vec2 p) {
	// A storm swell: big slow rollers under choppy, fast wind waves
	float storm = 1.0 - uCalm * 0.7;

	return (simplex(p * 0.04 + vec2(uTime * 0.09, uTime * 0.05)) * 0.7
		+ simplex(p * 0.12 - vec2(uTime * 0.16, -uTime * 0.09)) * 0.35 * storm
		+ simplex(p * 0.34 + vec2(uTime * 0.3, uTime * 0.22)) * 0.15 * storm) * (0.6 + storm * 0.4);
}

void main() {
	vec3 toSurface = vWorld - cameraPosition;
	float viewDistance = length(toSurface);
	vec3 view = toSurface / viewDistance;

	// Wave normal from the height field's slope
	vec2 e = vec2(0.6, 0.0);
	vec2 slope = vec2(waves(vWorld.xz + e.xy) - waves(vWorld.xz - e.xy), waves(vWorld.xz + e.yx) - waves(vWorld.xz - e.yx)) / (2.0 * e.x);

	// While the storm lasts, rain dimples the surface overhead (only close by: far off it would shimmer)
	float rainAmount = (1.0 - uCalm) * (1.0 - smoothstep(8.0, 30.0, viewDistance));
	vec3 rain = rainAmount > 0.0 ? raindrop(vWorld.xz * 1.4) * rainAmount : vec3(0.0);
	slope += rain.xy * 0.12;
	vec3 refracted = normalize(view + vec3(slope.x, 0.0, slope.y) * 0.55);

	// Snell's window (~48° cone overhead): the bright sky; outside it the surface mirrors the deep
	float window = smoothstep(0.62, 0.74, refracted.y);
	float rim = smoothstep(0.58, 0.68, refracted.y) * (1.0 - smoothstep(0.68, 0.8, refracted.y));

	// Overcast storm sky: grey and heavy, the sun only a smear behind the clouds
	vec3 sky = mix(uDownwellColor * 1.1, vec3(0.72, 0.78, 0.8) * 1.3, smoothstep(0.75, 1.0, refracted.y));
	float sun = pow(max(dot(refracted, uSunDirection), 0.0), 24.0) * 0.6;
	sky += vec3(0.9, 0.92, 0.95) * sun;

	// After the storm: the same sunset as above the water, squeezed into the window. Snell's window
	// holds the whole sky: its rim is the horizon, its centre straight up
	float elevation = clamp((refracted.y - 0.68) / 0.32, 0.0, 1.0) * 1.5708;
	vec2 heading = normalize(refracted.xz + 1e-4);
	vec3 skyDirection = vec3(heading * cos(elevation), sin(elevation)).xzy;
	vec3 sunset = sunsetSky(skyDirection, uSunset, uTime) * 1.6;
	sky = mix(sky, sunset, uCalm);
	sky += vec3(0.85, 0.9, 1.0) * uFlash * 1.4;
	sky += vec3(0.85, 0.9, 1.0) * bolt(refracted.xz) * uFlash * 22.0;

	// The bright web of light on the underside of waves
	float web = causticPattern(vWorld.xz * 0.028 + slope * 0.4, uTime * 0.35);
	vec3 mirrored = uWaterColor * (0.8 + web * 1.0) + uDownwellColor * web * 0.25 + uDownwellColor * uFlash * 0.4;
	mirrored += vec3(0.6, 0.35, 0.2) * web * uCalm * 0.6;

	// Where a close strike hits the water: a white-hot patch and a ring spreading out from it
	float impactDistance = length(vWorld.xz - uImpact);
	float ring = bell((impactDistance - uImpactAge * 22.0) / 2.5) * exp(-uImpactAge * 1.4);
	mirrored += vec3(0.85, 0.92, 1.0) * (exp(-impactDistance * impactDistance / 60.0) * uFlash * 5.0 + ring * 1.2);

	vec3 color = mix(mirrored, sky, window) + uDownwellColor * rim * 0.8;
	color += uDownwellColor * rain.z * 0.08;
	color *= uBrightness;

	// Fade into the same gradient as the backdrop; at grazing angles the surface dissolves completely,
	// so there is never a horizon line
	float fog = 1.0 - exp(-pow(uFogDensity * viewDistance * 0.85, 2.0));
	fog = max(fog, 1.0 - smoothstep(0.04, 0.32, view.y));
	vec3 fogColor = uWaterColor * mix(0.5, 1.7, smoothstep(-0.5, 0.9, view.y));
	gl_FragColor = vec4(mix(color, fogColor, fog), 1.0);
}
