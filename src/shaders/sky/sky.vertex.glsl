varying vec3 vDirection;

void main() {
	vDirection = position;
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mvPosition;
	// Pin to the far plane
	gl_Position.z = gl_Position.w;
}
