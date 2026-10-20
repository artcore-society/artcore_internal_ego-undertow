#include ../includes/noise.glsl
#include ../includes/sunset.glsl

uniform float uTime;
uniform vec3 uSunDirection;

varying vec3 vDirection;

void main() {
	gl_FragColor = vec4(sunsetSky(normalize(vDirection), uSunDirection, uTime), 1.0);
}
