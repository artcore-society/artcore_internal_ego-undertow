uniform vec3 uColor;
uniform float uIntensity;

varying float vAlong;
varying float vFacing;

void main() {
	// Soft at the rim, fading out along the beam: a cheap fake of light scattering in the water
	float alpha = pow(vFacing, 2.0) * pow(1.0 - vAlong, 2.2) * smoothstep(0.0, 0.08, vAlong) * uIntensity * 0.22;

	gl_FragColor = vec4(uColor * alpha, 1.0);
}
