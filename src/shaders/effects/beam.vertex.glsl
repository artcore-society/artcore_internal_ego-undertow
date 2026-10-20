varying float vAlong;
varying float vFacing;

void main() {
	vAlong = clamp(-position.z / LENGTH, 0.0, 1.0);

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vec3 viewNormal = normalize(normalMatrix * normal);
	vFacing = abs(dot(viewNormal, normalize(-mvPosition.xyz)));

	gl_Position = projectionMatrix * mvPosition;
}
