// Tileable sunlight caustics (after Dave Hoskins / joltz0r). Cheap: four iterations, no textures.
float causticPattern(vec2 uv, float time) {
	vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
	vec2 i = p;
	float c = 1.0;
	float intensity = 0.005;

	for (int n = 0; n < 4; n++) {
		float t = time * (1.0 - (3.5 / float(n + 1)));
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
		c += 1.0 / length(vec2(p.x / (sin(i.x + t) / intensity), p.y / (cos(i.y + t) / intensity)));
	}

	c /= 4.0;
	c = 1.17 - pow(c, 1.4);

	return pow(abs(c), 8.0);
}
