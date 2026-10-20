// A humpback's swim stroke. Its body is uLength long along Z: head at -Z, flukes at +Z.
float halfLength = uLength * 0.5;
float along = clamp(transformed.z / halfLength, -1.0, 1.0);
float stroke = uTime * 0.85;

// A wave runs from the middle to the tail, growing into big up-and-down fluke beats
float tail = smoothstep(-0.15, 1.0, along);
transformed.y += sin(stroke - along * 2.2) * tail * tail * uLength * 0.075;

// The head bobs a little against the stroke
float head = smoothstep(0.1, -1.0, along);
transformed.y -= sin(stroke + 0.9) * head * uLength * 0.012;

// The long pectoral fins sweep slowly, more towards their tips
float span = abs(transformed.x) - uLength * 0.1;
float fin = smoothstep(0.0, uLength * 0.25, span) * smoothstep(0.1, -0.6, along);
transformed.y += sin(stroke * 0.6 + 0.4) * fin * span * 0.35;
