#include ../includes/noise.glsl
#include ../includes/sunset.glsl
#include ../includes/sea.glsl

uniform float uTime;
uniform vec3 uSunDirection;

varying vec3 vWorld;

void main() {
	vec3 toSea = vWorld - cameraPosition;
	float distance = length(toSea);
	vec3 view = toSea / distance;

	// Ripples flatten out with distance, or they shimmer into noise
	float detail = 1.0 / (1.0 + distance * 0.012);
	float swell = 1.0 - smoothstep(150.0, 600.0, distance);
	vec2 e = vec2(0.25, 0.0);
	vec2 slope = vec2(
		seaHeight(vWorld.xz + e.xy, uTime, detail) - seaHeight(vWorld.xz - e.xy, uTime, detail),
		seaHeight(vWorld.xz + e.yx, uTime, detail) - seaHeight(vWorld.xz - e.yx, uTime, detail)
	) / (2.0 * e.x);
	vec3 normal = normalize(vec3(-slope.x * mix(0.35, 1.0, swell), 1.0, -slope.y * mix(0.35, 1.0, swell)));

	vec3 reflected = reflect(view, normal);
	reflected.y = abs(reflected.y);
	float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(-view, normal), 0.0), 5.0);

	// What comes up from below: deep teal, with the city's glow far down
	vec3 body = vec3(0.012, 0.05, 0.065) + vec3(0.06, 0.14, 0.12) * max(normal.y - 0.9, 0.0) * 4.0;
	vec3 sky = sunsetSky(reflected, uSunDirection, uTime);
	vec3 color = mix(body, sky, fresnel);

	// The sun's road: a glittering path of highlights on the ripples
	float glitter = pow(max(dot(reflected, uSunDirection), 0.0), 420.0) * 30.0
		+ pow(max(dot(reflected, uSunDirection), 0.0), 40.0) * 0.5;
	color += vec3(1.0, 0.68, 0.38) * glitter;

	// Haze towards the horizon melts the sea into the sky: no hard line, just a warm mist
	float haze = 1.0 - exp(-distance * 0.0032);
	haze = max(haze, 1.0 - smoothstep(0.0, 0.06, -view.y));
	vec3 horizon = sunsetSky(normalize(vec3(view.x, 0.0, view.z)), uSunDirection, uTime);
	gl_FragColor = vec4(mix(color, horizon, haze), 1.0);
}
