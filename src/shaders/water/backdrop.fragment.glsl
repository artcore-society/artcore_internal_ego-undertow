uniform vec3 uWaterColor;
uniform vec3 uDownwellColor;
uniform vec3 uSunDirection;
uniform float uSunGlow;
uniform float uFlash;

varying vec3 vDirection;

void main() {
	vec3 direction = normalize(vDirection);

	// Same gradient as the fog, so geometry melts into the backdrop
	vec3 color = uWaterColor * mix(0.5, 1.7, smoothstep(-0.5, 0.9, direction.y));

	// The sun seen through the water: a broad soft glow overhead
	float sun = pow(max(dot(direction, uSunDirection), 0.0), 6.0);
	color += uDownwellColor * sun * uSunGlow;

	// Lightning lights the water from above
	color += uDownwellColor * uFlash * smoothstep(-0.3, 0.9, direction.y) * 0.7;

	gl_FragColor = vec4(color, 1.0);
}
