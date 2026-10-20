uniform vec3 uTop;
uniform vec3 uMiddle;
uniform vec3 uBottom;

varying vec3 vDirection;

void main() {
	float y = normalize(vDirection).y;
	vec3 color = y > 0.0 ? mix(uMiddle, uTop, pow(y, 0.6)) : mix(uMiddle, uBottom, pow(-y, 0.5));

	// Snell's window: a hot spot straight up gives speculars somewhere to come from
	gl_FragColor = vec4(color * (y > 0.85 ? 3.0 : 1.0), 1.0);
}
