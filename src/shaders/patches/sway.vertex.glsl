// Plants sway in the swell: more at the tip, phase shifted by where they stand
#ifdef USE_INSTANCING
	vec3 swayRoot = instanceMatrix[3].xyz;
#else
	vec3 swayRoot = vec3(0.0);
#endif

float swayHeight = clamp(position.y, 0.0, 1.0);
float swayPhase = uTime * 0.7 + swayRoot.x * 0.11 + swayRoot.z * 0.07;
float swayBend = swayHeight * swayHeight * uSwayAmount;
transformed.x += sin(swayPhase + swayHeight * 2.2) * swayBend;
transformed.z += cos(swayPhase * 0.8 + swayHeight * 1.7) * swayBend * 0.6;
