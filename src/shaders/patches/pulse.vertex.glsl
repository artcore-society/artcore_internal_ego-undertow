// Jellyfish: the bell contracts, tentacles trail, the whole animal bobs
#ifdef USE_INSTANCING
	float pulsePhase = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
#else
	float pulsePhase = 0.0;
#endif

float pulse = sin(uTime * 2.1 + pulsePhase);
float bell = smoothstep(-0.2, 0.4, position.y);
transformed.xz *= 1.0 + pulse * 0.16 * bell;
transformed.xz += vec2(sin(uTime * 1.3 + position.y * 2.0 + pulsePhase), cos(uTime * 1.1 + position.y * 2.0)) * 0.12 * (1.0 - bell);
transformed.y += sin(uTime * 0.6 + pulsePhase) * 0.9 - pulse * 0.08;
