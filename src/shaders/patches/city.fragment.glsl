// Atlantis wakes in a ring spreading from the spire: windows on walls, a soft glow on everything
float cityDistance = length(vCausticWorld.xz - uCityCentre.xz);
float cityLit = smoothstep(uLitRadius, uLitRadius - 30.0, cityDistance);

if (cityLit > 0.001) {
	vec2 cell = vec2((vCausticWorld.x + vCausticWorld.z) * 0.85, vCausticWorld.y * 0.65);
	float window = step(0.55, fract(cell.x)) * step(0.45, fract(cell.y)) * step(0.45, hash21(floor(cell)));
	float wall = 1.0 - smoothstep(0.3, 0.6, abs(vCausticUp));

	outgoingLight += uWindowColor * (window * wall * 2.2 + diffuseColor.rgb * 0.18) * cityLit;
}
