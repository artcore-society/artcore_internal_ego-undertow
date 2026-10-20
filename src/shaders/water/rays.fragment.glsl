uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor;

varying float vAlong;
varying float vAcross;
varying float vFade;
varying float vPhase;

void main() {
	float edge = pow(1.0 - smoothstep(0.0, 1.0, abs(vAcross)), 1.6);
	float falloff = pow(1.0 - smoothstep(0.0, 1.0, vAlong), 1.5) * smoothstep(0.0, 0.08, vAlong);
	float flicker = 0.6 + 0.4 * sin(uTime * 0.9 + vPhase * 23.0) * sin(uTime * 0.37 + vPhase * 11.0);
	float alpha = edge * falloff * flicker * vFade * uIntensity * 0.16;

	gl_FragColor = vec4(uColor * alpha, 1.0);
}
