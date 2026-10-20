// The open sea's height field: a long swell in rolling wave trains, with wind ripples on top.
// Needs noise.glsl included first.

/** Rolling waves you can see move: a few long trains from the same wind, slightly spread. */
float seaSwell(vec2 p, float time) {
	return sin(dot(p, vec2(0.08, -0.18)) + time * 0.9) * 0.45
		+ sin(dot(p, vec2(-0.12, -0.26)) + time * 1.25 + 1.7) * 0.25
		+ sin(dot(p, vec2(0.3, -0.35)) + time * 1.7 + 4.1) * 0.1
		+ simplex(p * 0.02 + vec2(0.0, -time * 0.02)) * 0.35;
}

/** Height in metres: swell plus ripples (the ripples only shade, they're too small to move vertices). */
float seaHeight(vec2 p, float time, float detail) {
	vec2 wind = vec2(0.3, -1.0);
	float ripples = simplex(p * 0.21 + wind.yx * time * 0.09) * 0.12
		+ simplex(p * 0.7 + wind * time * 0.25) * 0.04
		+ simplex(p * 2.1 - wind.yx * time * 0.5) * 0.012;

	return seaSwell(p, time) + ripples * detail;
}
