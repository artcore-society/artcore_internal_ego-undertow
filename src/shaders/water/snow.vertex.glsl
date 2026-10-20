uniform float uTime;
uniform float uBox;
uniform float uSize;
uniform float uPixelRatio;

attribute vec4 aSeed;

varying float vFade;

void main() {
	vec3 drift = vec3(sin(uTime * 0.2 + aSeed.w * 6.28) * 0.6, -uTime * (0.15 + aSeed.w * 0.25), cos(uTime * 0.17 + aSeed.w * 4.0) * 0.6);
	vec3 local = mod(aSeed.xyz * uBox + drift - cameraPosition + uBox * 0.5, uBox) - uBox * 0.5;
	vec4 mvPosition = viewMatrix * vec4(cameraPosition + local, 1.0);

	float viewDistance = -mvPosition.z;
	// Flakes right at the lens would bloom into big discs: fade them out, and keep every flake small
	vFade = smoothstep(1.5, 4.0, viewDistance) * (1.0 - smoothstep(uBox * 0.25, uBox * 0.5, length(local)));

	float size = uSize * (0.5 + aSeed.w) * uPixelRatio / max(viewDistance, 0.1);
	gl_PointSize = clamp(size, 1.0, 6.0 * uPixelRatio);
	// Sub-pixel flakes shimmer: let the tiny ones go dimmer instead
	vFade *= smoothstep(0.6, 1.6, size);
	gl_Position = projectionMatrix * mvPosition;
}
