// The sky after the storm: one function shared by the dome and the sea that mirrors it.
// Needs noise.glsl included first.

/** Thin, wind-stretched clouds near the horizon, lit warm from below by the low sun. */
float sunsetClouds(vec3 direction, float time) {
	vec2 p = direction.xz / max(direction.y + 0.12, 0.05);
	float bands = simplex(p * vec2(0.35, 1.6) + vec2(time * 0.004, 0.0)) * 0.6
		+ simplex(p * vec2(0.9, 3.4) - vec2(time * 0.006, 0.0)) * 0.3
		+ simplex(p * 2.8) * 0.1;
	float cover = smoothstep(0.08, 0.55, bands);
	// Only a broken layer above the horizon, thinning out overhead
	return cover * smoothstep(0.0, 0.05, direction.y) * (1.0 - smoothstep(0.2, 0.55, direction.y));
}

/** Sunset sky radiance (HDR) in a direction, with the sun low over the horizon. */
vec3 sunsetSky(vec3 direction, vec3 sun, float time) {
	float height = max(direction.y, 0.0);
	float toward = max(dot(normalize(direction.xz + 1e-4), normalize(sun.xz)), 0.0);
	float glow = pow(max(dot(direction, sun), 0.0), 6.0);

	// Kept below 1 so bloom only catches the sun and its road on the water
	vec3 zenith = vec3(0.025, 0.035, 0.1);
	vec3 middle = mix(vec3(0.09, 0.06, 0.12), vec3(0.32, 0.11, 0.05), toward * toward);
	vec3 horizon = mix(vec3(0.24, 0.1, 0.08), vec3(0.62, 0.22, 0.06), toward);

	vec3 color = mix(horizon, middle, smoothstep(0.0, 0.16, height));
	color = mix(color, zenith, smoothstep(0.12, 0.75, height));
	color += vec3(0.8, 0.3, 0.08) * glow * 0.5;

	// The sun: a soft disc and its halo
	float disc = smoothstep(0.9994, 0.99975, dot(direction, sun));
	color += vec3(1.4, 0.65, 0.22) * pow(max(dot(direction, sun), 0.0), 260.0) + vec3(5.0, 3.0, 1.4) * disc;

	// Clouds: dark violet away from the sun, gold-rimmed towards it
	float clouds = sunsetClouds(direction, time);
	vec3 cloudColor = mix(vec3(0.04, 0.03, 0.06), vec3(0.75, 0.26, 0.08), pow(toward, 3.0) * 0.9 + glow * 0.6);
	color = mix(color, cloudColor, clouds * 0.85);

	// A band of mist sits on the horizon, softening where sea and sky meet
	color = mix(color, horizon * 1.1 + vec3(0.06, 0.03, 0.02), (1.0 - smoothstep(0.0, 0.07, direction.y)) * 0.75);

	// Below the horizon (only seen in reflections at grazing angles): the haze itself
	return mix(horizon * 1.05, color, smoothstep(-0.03, 0.02, direction.y));
}
