uniform float uTime;

// x, y, z offset and scale per jellyfish
attribute vec4 aJelly;
// 0 = bell, 1 = oral arm, 2 = tentacle
attribute float aPart;
// 0..1 along an arm or tentacle (0 at the bell)
attribute float aAlong;

varying vec3 vNormal;
varying vec3 vView;
varying float vPart;
varying float vAlong;
varying vec2 vBell;
varying float vDistance;

void main() {
	float phase = aJelly.x * 0.37 + aJelly.z * 0.23;
	// A jellyfish swims in pulses: a quick contraction, a slow relaxation
	float cycle = fract(uTime * 0.45 + phase);
	float contract = smoothstep(0.0, 0.18, cycle) * (1.0 - smoothstep(0.18, 0.9, cycle));

	vec3 p = position;
	vec3 n = normal;

	if (aPart < 0.5) {
		// The rim squeezes in and the dome lifts
		float rim = smoothstep(0.1, -0.2, p.y);
		p.xz *= 1.0 - contract * 0.28 * rim;
		p.y += contract * 0.08 * (1.0 - rim);
	} else {
		// Arms and tentacles trail behind, lagging the pulse further down their length
		float lag = sin(uTime * 1.3 + phase * 6.0 - aAlong * 4.0) * aAlong;
		p.x += lag * 0.35 + sin(uTime * 0.7 + aAlong * 3.0 + phase) * aAlong * 0.2;
		p.z += cos(uTime * 1.1 - aAlong * 3.5 + phase * 4.0) * aAlong * 0.3;
		p.y += contract * aAlong * 0.35;
		p.xz *= 1.0 - contract * 0.2 * (1.0 - aAlong);
	}

	// The whole animal rises a little with each pulse and drifts
	vec3 offset = aJelly.xyz + vec3(sin(uTime * 0.13 + phase) * 1.5, sin(uTime * 0.45 + phase) * 0.6 + contract * 0.25, cos(uTime * 0.11 + phase) * 1.5);
	vec4 world = modelMatrix * vec4(p * aJelly.w + offset, 1.0);

	vNormal = normalize(mat3(modelMatrix) * n);
	vView = cameraPosition - world.xyz;
	vDistance = length(vView);
	vPart = aPart;
	vAlong = aAlong;
	vBell = position.xz;

	gl_Position = projectionMatrix * viewMatrix * world;
}
