uniform vec3 uColor;
uniform float uOpacity;
uniform vec3 uWakeColor;

varying float vFade;
varying float vGlow;

void main() {
	float d = length(gl_PointCoord - 0.5);
	float shape = smoothstep(0.5, 0.1, d) * vFade;
	// Glowing plankton is bright enough to bloom
	vec3 color = uColor * uOpacity + uWakeColor * vGlow * 2.5;

	gl_FragColor = vec4(color * shape, 1.0);
}
