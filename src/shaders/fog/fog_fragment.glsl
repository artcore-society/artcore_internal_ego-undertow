#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp(- fogDensity * fogDensity * vFogDepth * vFogDepth);
	#else
		float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
	#endif

	// Water is brighter towards the surface and darker towards the deep
	float fogUp = normalize(vFogDirection).y;
	vec3 waterColor = fogColor * mix(0.5, 1.7, smoothstep(-0.5, 0.9, fogUp));

	// Water absorbs red first: distant things turn blue-green before they disappear
	gl_FragColor.rgb *= mix(vec3(1.0), vec3(0.55, 0.85, 1.0), fogFactor * 0.6);
	gl_FragColor.rgb = mix(gl_FragColor.rgb, waterColor, fogFactor);
#endif
