uniform float uTime;
uniform float uIntensity;
uniform vec3 uColor;

varying float vAlong;
varying float vAcross;
varying float vFade;
varying float vPhase;

void main() {
	float edge = 1.0 - smoothstep(0.2, 1.0, abs(vAcross));
	float falloff = (1.0 - smoothstep(0.0, 1.0, vAlong)) * smoothstep(0.0, 0.06, vAlong);
	float flicker = 0.6 + 0.4 * sin(uTime * 0.9 + vPhase * 23.0) * sin(uTime * 0.37 + vPhase * 11.0);
	float alpha = edge * falloff * flicker * vFade * uIntensity * 0.16;

	gl_FragColor = vec4(uColor * alpha, 1.0);
}
