varying float vHeight;
varying float vFacing;

void main() {
	vHeight = uv.y;

	vec4 world = modelMatrix * vec4(position, 1.0);
	vec3 normalWorld = normalize(mat3(modelMatrix) * normal);
	vFacing = abs(dot(normalWorld, normalize(cameraPosition - world.xyz)));

	gl_Position = projectionMatrix * viewMatrix * world;
}
