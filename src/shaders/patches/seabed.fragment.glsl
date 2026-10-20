// Triplanar rock wherever the canyon is steep, so cliffs never show stretched texture
vec3 rockWeights = pow(abs(normalize(vSeabedNormal)), vec3(4.0));
rockWeights /= rockWeights.x + rockWeights.y + rockWeights.z;
vec3 rockScale = vCausticWorld * 0.09;
vec3 rock = texture2D(uRockMap, rockScale.zy).rgb * rockWeights.x
	+ texture2D(uRockMap, rockScale.xz).rgb * rockWeights.y
	+ texture2D(uRockMap, rockScale.xy).rgb * rockWeights.z;

// Coral rubble patches in the shallows
float rubbleMask = smoothstep(0.45, 0.62, texture2D(uRockMap, vCausticWorld.xz * 0.006).g) * smoothstep(uRubbleZ - 60.0, uRubbleZ, vCausticWorld.z);
vec3 rubble = texture2D(uRubbleMap, vCausticWorld.xz * 0.16).rgb;

// Low-frequency variation breaks up the tiling
float macro = 0.78 + texture2D(uRockMap, vCausticWorld.xz * 0.0045).r * 0.45;

vec3 ground = mix(diffuseColor.rgb, rubble * vColor.rgb, rubbleMask);
diffuseColor.rgb = mix(ground, rock * vColor.rgb * 1.15, vRock) * macro;
