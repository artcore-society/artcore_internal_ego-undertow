uniform float uLitRadius;
uniform vec3 uCityCentre;
uniform vec3 uWindowColor;
// Unit directions (x, z) of the avenues from the heart
uniform vec2 uAvenues[3];

// How far the waking light has to travel to reach a point: along the avenues it races, so every metre
// off the nearest avenue counts extra
float cityWakeDistance(vec2 offset) {
	float off = length(offset);

	for (int i = 0; i < 3; i++) {
		float along = dot(offset, uAvenues[i]);
		off = min(off, along > 0.0 ? length(offset - uAvenues[i] * along) : length(offset));
	}

	return length(offset) + off * 1.5;
}
