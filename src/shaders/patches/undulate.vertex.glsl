// The whale's body flexes up and down, mostly behind the pectoral fins
float undulateT = clamp(transformed.z / uLength + 0.35, 0.0, 1.0);
transformed.y += sin(uTime * 0.9 - transformed.z * 0.22) * undulateT * undulateT * 0.9;
