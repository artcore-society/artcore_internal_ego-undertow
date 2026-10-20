uniform vec3 uColor;
uniform vec3 uGlow;
uniform float uFogDensity;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vView;
varying float vPart;
varying float vAlong;
varying vec2 vBell;
varying float vDistance;

void main() {
	float facing = abs(dot(normalize(vNormal), normalize(vView)));
	vec3 color;
	float alpha;

	if (vPart < 0.5) {
		// Translucent bell: clear in the middle, glowing at the edges (Fresnel)
		float fresnel = pow(1.0 - facing, 2.2);
		float angle = atan(vBell.y, vBell.x);
		float radius = length(vBell);
		// Four horseshoe-shaped gonads seen through the bell
		float gonads = smoothstep(0.55, 0.9, cos(angle * 4.0)) * smoothstep(0.12, 0.2, radius) * (1.0 - smoothstep(0.3, 0.38, radius));
		float canals = smoothstep(0.92, 1.0, cos(angle * 16.0)) * smoothstep(0.15, 0.55, radius) * 0.5;

		color = uColor * (0.15 + fresnel * 1.6) + uGlow * (gonads * 1.4 + canals);
		alpha = 0.12 + fresnel * 0.7 + gonads * 0.5;
	} else if (vPart < 1.5) {
		// Frilled oral arms
		color = uColor * 0.8 + uGlow * 0.3;
		alpha = 0.45 * (1.0 - vAlong * 0.6);
	} else {
		// Tentacles: thin, beaded with stinging cells, fading out
		float beads = 0.7 + 0.3 * sin(vAlong * 90.0 - uTime * 2.0);
		color = uColor * beads;
		alpha = 0.55 * pow(1.0 - vAlong, 1.4);
	}

	// Murk: fade with distance like everything else in the water
	alpha *= exp(-pow(uFogDensity * vDistance, 2.0));

	gl_FragColor = vec4(color * alpha, alpha);
}
