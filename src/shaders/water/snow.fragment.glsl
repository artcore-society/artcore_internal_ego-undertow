uniform vec3 uColor;
uniform float uOpacity;

varying float vFade;

void main() {
	float d = length(gl_PointCoord - 0.5);
	float alpha = smoothstep(0.5, 0.1, d) * vFade * uOpacity;

	gl_FragColor = vec4(uColor * alpha, 1.0);
}
