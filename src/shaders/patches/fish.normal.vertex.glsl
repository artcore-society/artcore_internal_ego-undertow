// Each fish circles its school centre; face along the orbit tangent
float fishAngle = aOrbit.w + uTime * aOrbit.z;
float fishTheta = aOrbit.z > 0.0 ? 3.14159265 - fishAngle : -fishAngle;
mat3 fishYaw = mat3(cos(fishTheta), 0.0, -sin(fishTheta), 0.0, 1.0, 0.0, sin(fishTheta), 0.0, cos(fishTheta));
objectNormal = fishYaw * objectNormal;
