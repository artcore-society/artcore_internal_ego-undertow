uniform float uTime;
uniform float uSurfaceY;
uniform float uCell;
uniform vec3 uSlant;

attribute vec4 aRay;

varying float vAlong;
varying float vAcross;
varying float vFade;
varying float vPhase;

void main() {
	// Wrap each shaft into a cell around the camera so the field never runs out
	vec2 offset = aRay.xy * uCell;
	vec2 centre = cameraPosition.xz + mod(offset - cameraPosition.xz + uCell * 0.5, uCell) - uCell * 0.5;
	centre += vec2(sin(uTime * 0.13 + aRay.w * 6.0), cos(uTime * 0.11 + aRay.w * 4.0)) * 1.5;

	vec3 origin = vec3(centre.x, uSurfaceY, centre.y);
	vec3 axis = normalize(vec3(uSlant.x, -1.0, uSlant.z));
	vec3 toCamera = normalize(cameraPosition - origin);
	vec3 right = normalize(cross(axis, toCamera));

	float along = position.y + 0.5;
	float width = aRay.z * (1.0 + along * 0.8);
	vec3 world = origin + right * position.x * width + axis * along * 70.0;

	vAlong = along;
	vAcross = position.x * 2.0;
	vPhase = aRay.w;

	float horizontal = length(world.xz - cameraPosition.xz);
	// Only shafts near the diver: far away they'd read as solid pillars
	vFade = smoothstep(3.0, 10.0, horizontal) * (1.0 - smoothstep(uCell * 0.12, uCell * 0.32, horizontal));

	gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
