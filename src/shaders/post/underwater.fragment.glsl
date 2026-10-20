#include ../includes/hash.glsl

uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 uResolution;
uniform float uDistortion;
uniform float uSpeed;
uniform float uHypoxia;
uniform float uFade;
uniform vec3 uTint;
uniform float uLamp;
// 0 = under water, 1 = out in the air
uniform float uAir;
// Water still streaming down the mask after surfacing, fading 1 → 0
uniform float uWet;
// Breaking the surface: 0 = the mask is still covered by a sheet of water, 1 = it has drained off
uniform float uSheet;

varying vec2 vUv;

void main() {
	vec2 centred = vUv - 0.5;
	float radius = length(centred);

	// Water bends light: a slow wobble, stronger towards the edges of the mask
	vec2 wobble = vec2(
		sin(vUv.y * 14.0 + uTime * 1.1) + sin(vUv.y * 23.0 - uTime * 0.7) * 0.5,
		cos(vUv.x * 12.0 + uTime * 0.9) + cos(vUv.x * 19.0 + uTime * 1.3) * 0.5
	) * uDistortion * (0.35 + radius);

	// Low on air: the world swims and the edges close in
	wobble += vec2(sin(uTime * 2.3 + vUv.y * 6.0), cos(uTime * 1.9 + vUv.x * 5.0)) * 0.004 * uHypoxia;

	wobble *= 1.0 - uAir;

	// Out of the water: rivulets run down the glass. Each is a thin rounded trail with a drop at its head,
	// bending the view like a tiny lens (no hard edges, so nothing reads as blocks)
	float lane = vUv.x * 38.0;
	float column = floor(lane);
	float across = fract(lane) - 0.5 - (hash11(column + 11.0) - 0.5) * 0.5;
	float present = step(0.5, hash11(column + 3.0));
	float head = fract(hash11(column + 7.0) - uTime * (0.12 + hash11(column) * 0.25));
	float above = vUv.y - head;
	float trail = smoothstep(0.0, 0.02, above) * (1.0 - smoothstep(0.05, 0.35 + hash11(column + 5.0) * 0.3, above));
	float drop = exp(-pow(above / 0.012, 2.0));
	float width = mix(0.07, 0.16, drop);
	float lens = exp(-across * across / (width * width)) * max(trail * 0.6, drop) * present;
	wobble += vec2(across * 0.05, -drop * 0.004) * lens * uWet;

	// The sheet of water on the mask right after breaking through: it drains from the top down, its
	// edge a bright wavering meniscus; below it the view is thick, bent and blue
	float edge = 1.08 - uSheet * 1.25 + sin(vUv.x * 9.0 + uTime * 3.0) * 0.025 + sin(vUv.x * 23.0 - uTime * 5.0) * 0.012;
	float covered = 1.0 - smoothstep(edge - 0.015, edge + 0.015, vUv.y);
	covered *= step(0.001, 1.0 - uSheet);
	wobble += vec2(sin(vUv.y * 30.0 + uTime * 6.0), cos(vUv.x * 26.0 + uTime * 5.0)) * 0.012 * covered;

	vec2 uv = vUv + wobble;
	float aberration = (0.0015 + uSpeed * 0.004) * radius;
	vec3 color = vec3(
		texture2D(tDiffuse, uv + centred * aberration).r,
		texture2D(tDiffuse, uv).g,
		texture2D(tDiffuse, uv - centred * aberration).b
	);

	// Under the sheet: smeared (a cheap blur), cooler and dimmer; the meniscus catches the light
	if (covered > 0.0) {
		vec3 smear = vec3(0.0);
		for (int i = -2; i <= 2; i++) {
			smear += texture2D(tDiffuse, uv + vec2(float(i) * 0.006, float(i) * 0.011)).rgb;
		}
		color = mix(color, smear * 0.2 * vec3(0.55, 0.78, 0.85), covered);
	}
	color += vec3(1.0, 0.85, 0.7) * exp(-pow((vUv.y - edge) / 0.006, 2.0)) * 0.35 * (1.0 - uSheet);

	// Head lamp scattering in the murk: a soft cone of lit particles ahead, slightly below centre
	vec2 beam = (vUv - vec2(0.53, 0.44)) * vec2(1.25, 1.0);
	float scatter = exp(-dot(beam, beam) * 7.0) * (0.85 + 0.15 * sin(uTime * 1.7 + vUv.y * 9.0));
	color += vec3(0.75, 0.9, 1.0) * scatter * uLamp * 0.06 * (1.0 - uAir);

	// Mask vignette, tinted with the water
	float vignette = smoothstep(0.8, 0.2, radius * (1.0 + uHypoxia * 0.6));
	// In the air the mask's rim is only a soft darkening, not the water's colour
	vec3 rim = mix(color * uTint * 0.25, color * 0.55, uAir);
	color = mix(rim, color, mix(vignette, 0.35 + vignette * 0.65, uAir));

	float grey = dot(color, vec3(0.299, 0.587, 0.114));
	color = mix(color, vec3(grey), uHypoxia * 0.55);

	float grain = hash21(vUv * uResolution + fract(uTime * 7.31) * 100.0) - 0.5;
	color += grain * 0.03 * (0.4 + 0.6 * grey);

	gl_FragColor = vec4(color * (1.0 - uFade), 1.0);
}
