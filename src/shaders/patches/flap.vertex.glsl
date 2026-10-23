// A manta's wing beat: a slow wave travels out from the body to the tips, which rise and fall the most
float wing = abs(transformed.x) / uHalfSpan;
transformed.y += sin(uTime * 1.3 - wing * 1.6) * pow(wing, 1.6) * uHalfSpan * 0.32;
// The tips curl back a little on every stroke
transformed.z += cos(uTime * 1.3 - wing * 1.6) * wing * wing * uHalfSpan * 0.06;
