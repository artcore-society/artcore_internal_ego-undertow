#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
	// View-space position rotated back to world space: the direction this fragment is seen in
	vFogDirection = (vec4(mvPosition.xyz, 0.0) * viewMatrix).xyz;
#endif
