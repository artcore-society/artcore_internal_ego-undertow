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

	vec2 uv = vUv + wobble;
	float aberration = (0.0015 + uSpeed * 0.004) * radius;
	vec3 color = vec3(
		texture2D(tDiffuse, uv + centred * aberration).r,
		texture2D(tDiffuse, uv).g,
		texture2D(tDiffuse, uv - centred * aberration).b
	);

	// Head lamp scattering in the murk: a soft cone of lit particles ahead, slightly below centre
	vec2 beam = (vUv - vec2(0.53, 0.44)) * vec2(1.25, 1.0);
	float scatter = exp(-dot(beam, beam) * 7.0) * (0.85 + 0.15 * sin(uTime * 1.7 + vUv.y * 9.0));
	color += vec3(0.75, 0.9, 1.0) * scatter * uLamp * 0.06;

	// Mask vignette, tinted with the water
	float vignette = smoothstep(0.8, 0.2, radius * (1.0 + uHypoxia * 0.6));
	color = mix(color * uTint * 0.25, color, vignette);

	float grey = dot(color, vec3(0.299, 0.587, 0.114));
	color = mix(color, vec3(grey), uHypoxia * 0.55);

	float grain = hash21(vUv * uResolution + fract(uTime * 7.31) * 100.0) - 0.5;
	color += grain * 0.03 * (0.4 + 0.6 * grey);

	gl_FragColor = vec4(color * (1.0 - uFade), 1.0);
}
