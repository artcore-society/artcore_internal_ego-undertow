// Sunlight caustics on everything facing up, fading with depth
float causticFade = clamp(1.0 - (uSurfaceY - vCausticWorld.y) / 120.0, 0.0, 1.0) * uCausticStrength;

if (causticFade > 0.001) {
	float causticLight = causticPattern(vCausticWorld.xz * 0.075, uTime * 0.55);
	outgoingLight += diffuseColor.rgb * uCausticTint * causticLight * causticFade * smoothstep(-0.1, 0.9, vCausticUp) * 1.6;
}

// The diver's sonar: a ring sweeping out through the water, outlining whatever it passes
if (uPingRadius > 0.0) {
	float pingBand = bell((length(vCausticWorld - uPingOrigin) - uPingRadius) / 0.8);
	// Fades in clear of the diver (no flash at their feet) and out towards the end of its reach
	float pingFade = smoothstep(3.0, 10.0, uPingRadius) * (1.0 - smoothstep(25.0, 70.0, uPingRadius));
	outgoingLight += vec3(0.37, 0.95, 0.88) * pingBand * pingFade * 0.45;
}
