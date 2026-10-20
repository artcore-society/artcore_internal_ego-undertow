vec4 causticWorld = vec4(transformed, 1.0);

#ifdef USE_INSTANCING
	causticWorld = instanceMatrix * causticWorld;
#endif

vCausticWorld = (modelMatrix * causticWorld).xyz;
vCausticUp = inverseTransformDirection(transformedNormal, viewMatrix).y;
