uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uHeight;

attribute vec3 aSeed;

varying float vAlpha;

void main() {
	float rise = mod(uTime * (1.6 + aSeed.z * 1.4) + aSeed.z * uHeight, uHeight);
	float spread = 0.2 + rise * 0.05;
	vec3 local = vec3(
		(aSeed.x - 0.5) * spread + sin(uTime * 2.0 + aSeed.z * 30.0) * 0.12 * rise * 0.1,
		rise,
		(aSeed.y - 0.5) * spread + cos(uTime * 1.7 + aSeed.z * 20.0) * 0.12 * rise * 0.1
	);
	vec4 mvPosition = modelViewMatrix * vec4(local, 1.0);

	vAlpha = smoothstep(0.0, 0.6, rise) * (1.0 - smoothstep(uHeight * 0.7, uHeight, rise));
	gl_PointSize = uSize * (0.5 + aSeed.z) * uPixelRatio / max(-mvPosition.z, 0.1);
	gl_Position = projectionMatrix * mvPosition;
}
