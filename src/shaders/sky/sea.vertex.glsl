#include ../includes/noise.glsl
#include ../includes/sea.glsl

uniform float uTime;

varying vec3 vWorld;

void main() {
	vec4 world = modelMatrix * vec4(position, 1.0);
	// The swell lifts the water; it calms down towards the horizon, where it's too small to see anyway
	float distance = length(world.xz - cameraPosition.xz);
	world.y += seaSwell(world.xz, uTime) * (1.0 - smoothstep(150.0, 600.0, distance));
	vWorld = world.xyz;
	gl_Position = projectionMatrix * viewMatrix * world;
}
