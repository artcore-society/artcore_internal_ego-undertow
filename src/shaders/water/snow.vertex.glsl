uniform float uTime;
uniform float uBox;
uniform float uSize;
uniform float uPixelRatio;
uniform float uWake;
uniform vec3 uCarried;

attribute vec4 aSeed;

varying float vFade;
varying float vGlow;

void main() {
	vec3 drift = vec3(sin(uTime * 0.2 + aSeed.w * 6.28) * 0.6, -uTime * (0.15 + aSeed.w * 0.25), cos(uTime * 0.17 + aSeed.w * 4.0) * 0.6);
	// Carried by the current: the specks stream past even while the diver hangs still
	vec3 local = mod(aSeed.xyz * uBox + drift + uCarried - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5;
	vec4 mvPosition = viewMatrix * vec4(cameraPosition + local, 1.0);

	float viewDistance = -mvPosition.z;
	// Flakes right at the lens would bloom into big discs: fade them out, and keep every flake small
	vFade = smoothstep(1.5, 4.0, viewDistance) * (1.0 - smoothstep(uBox * 0.25, uBox * 0.5, length(local)));

	// The wake: plankton close around the diver flares up, every speck twinkling on its own beat
	float twinkle = 0.55 + 0.45 * sin(uTime * (2.0 + aSeed.y * 3.0) + aSeed.x * 40.0);
	vGlow = uWake * (1.0 - smoothstep(3.0, 10.0, length(local))) * twinkle * step(0.35, aSeed.z);

	float size = uSize * (0.5 + aSeed.w) * (1.0 + vGlow) * uPixelRatio / max(viewDistance, 0.1);
	gl_PointSize = clamp(size, 1.0, 6.0 * uPixelRatio);
	// Sub-pixel flakes shimmer: let the tiny ones go dimmer instead
	vFade *= smoothstep(0.6, 1.6, size);
	gl_Position = projectionMatrix * mvPosition;
}
