// Tail wiggle grows towards the tail (+Z), faster for faster fish
float tail = smoothstep(-0.2, 0.6, transformed.z);
transformed.x += sin(uTime * (7.0 + abs(aOrbit.z) * 10.0) + aOrbit.w * 7.0 - transformed.z * 5.0) * 0.14 * tail;
transformed *= aScale;

float fishRadius = aOrbit.x * (1.0 + 0.18 * sin(uTime * 0.31 + aOrbit.w * 3.0));
vec3 fishCentre = vec3(cos(fishAngle) * fishRadius, aOrbit.y + sin(fishAngle * 2.0 + aOrbit.w) * 1.2, sin(fishAngle) * fishRadius);
transformed = fishYaw * transformed + fishCentre;
