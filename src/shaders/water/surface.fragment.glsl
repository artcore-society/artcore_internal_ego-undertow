#include ../includes/caustics.glsl

uniform float uTime;
uniform vec3 uWaterColor;
uniform vec3 uSkyColor;
uniform float uFogDensity;
uniform float uBrightness;

varying vec3 vWorld;

void main() {
	vec3 toSurface = vWorld - cameraPosition;
	float viewDistance = length(toSurface);
	vec3 view = toSurface / viewDistance;

	// Snell's window: looking up you see the sky, at a grazing angle the surface mirrors the deep
	float window = smoothstep(0.55, 0.9, view.y);
	float ripple = causticPattern(vWorld.xz * 0.035, uTime * 0.4);
	vec3 mirrored = uWaterColor * (0.85 + ripple * 0.6);
	vec3 sky = uSkyColor * (1.2 + ripple * 0.8);
	vec3 color = mix(mirrored, sky, window) * uBrightness;

	float fog = 1.0 - exp(-pow(uFogDensity * viewDistance * 0.75, 2.0));
	gl_FragColor = vec4(mix(color, uWaterColor, fog), 1.0);
}
