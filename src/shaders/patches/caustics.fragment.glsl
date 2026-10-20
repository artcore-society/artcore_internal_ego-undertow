// Sunlight caustics on everything facing up, fading with depth
float causticFade = clamp(1.0 - (uSurfaceY - vCausticWorld.y) / 120.0, 0.0, 1.0) * uCausticStrength;

if (causticFade > 0.001) {
	float causticLight = causticPattern(vCausticWorld.xz * 0.075, uTime * 0.55);
	outgoingLight += diffuseColor.rgb * uCausticTint * causticLight * causticFade * smoothstep(-0.1, 0.9, vCausticUp) * 1.6;
}
