// Texture projected along the world axes: big merged blocks and instanced buildings never stretch it
vec3 triplanarWeights = pow(abs(normalize(vTriplanarNormal)), vec3(4.0));
triplanarWeights /= triplanarWeights.x + triplanarWeights.y + triplanarWeights.z;
vec3 triplanarPoint = vCausticWorld * uTriplanarScale;
vec3 triplanarColor = texture2D(uTriplanarMap, triplanarPoint.zy).rgb * triplanarWeights.x
	+ texture2D(uTriplanarMap, triplanarPoint.xz).rgb * triplanarWeights.y
	+ texture2D(uTriplanarMap, triplanarPoint.xy).rgb * triplanarWeights.z;

diffuseColor.rgb *= triplanarColor;
