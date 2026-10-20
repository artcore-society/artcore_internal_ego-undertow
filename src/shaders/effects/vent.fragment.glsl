uniform vec3 uColor;

varying float vAlpha;

void main() {
	float d = length(gl_PointCoord - 0.5);

	if (d > 0.5) {
		discard;
	}

	// A ring with a bright highlight reads as a bubble at any size
	float rim = smoothstep(0.32, 0.47, d) * (1.0 - smoothstep(0.47, 0.5, d));
	float highlight = smoothstep(0.16, 0.0, length(gl_PointCoord - vec2(0.36, 0.32)));
	float alpha = (rim * 0.8 + highlight + 0.08) * vAlpha;

	gl_FragColor = vec4(uColor * alpha, 1.0);
}
