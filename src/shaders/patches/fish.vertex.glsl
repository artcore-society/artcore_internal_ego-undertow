float fishRadius = aOrbit.x * (1.0 + 0.18 * sin(uTime * 0.31 + aOrbit.w * 3.0));
vec3 fishCentre = vec3(cos(fishAngle) * fishRadius, aOrbit.y + sin(fishAngle * 2.0 + aOrbit.w) * 1.2, sin(fishAngle) * fishRadius);

// Shy of the diver: pushed off the camera's path (a little upwards), back in their orbit once it has
// passed. Big fish don't care. Schools are only ever translated, so world offsets are object offsets.
vec3 fishFromCamera = (modelMatrix * vec4(fishCentre, 1.0)).xyz - cameraPosition;
float fishFear = (1.0 - smoothstep(1.5, 6.0, length(fishFromCamera))) * (1.0 - smoothstep(0.6, 2.0, aScale));
fishCentre += normalize(fishFromCamera + vec3(0.0, 0.6, 0.0)) * fishFear * 3.5;

// Tail wiggle grows towards the tail (+Z), faster for faster fish, wider for fleeing ones
float tail = smoothstep(-0.2, 0.6, transformed.z);
transformed.x += sin(uTime * (7.0 + abs(aOrbit.z) * 10.0) + aOrbit.w * 7.0 - transformed.z * 5.0) * 0.14 * (1.0 + fishFear) * tail;
transformed *= aScale;

transformed = fishYaw * transformed + fishCentre;
