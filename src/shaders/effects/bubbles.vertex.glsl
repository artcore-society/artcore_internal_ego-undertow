uniform float uSize;
uniform float uPixelRatio;

attribute float aScale;
attribute float aAlpha;

varying float vAlpha;

void main() {
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vAlpha = aAlpha;
	gl_PointSize = uSize * aScale * uPixelRatio / max(-mvPosition.z, 0.1);
	gl_Position = projectionMatrix * mvPosition;
}
