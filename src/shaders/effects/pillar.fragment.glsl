uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;

varying float vHeight;
varying float vFacing;

void main() {
	// Brightest at the core of the beam (where it faces the eye), fading up into the water
	float core = pow(vFacing, 3.0);
	float rise = (1.0 - smoothstep(0.0, 1.0, vHeight)) * smoothstep(0.0, 0.03, vHeight);
	float shimmer = 0.85 + 0.15 * sin(vHeight * 60.0 - uTime * 3.0);
	float alpha = core * rise * shimmer * uIntensity;

	gl_FragColor = vec4(uColor * alpha, 1.0);
}
