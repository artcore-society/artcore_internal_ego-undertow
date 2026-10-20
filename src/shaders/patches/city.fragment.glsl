// Atlantis wakes in a ring spreading from its heart: the stone takes on a soft glow, brightest on
// surfaces facing up towards the light
float cityDistance = length(vCausticWorld.xz - uCityCentre.xz);
float cityLit = smoothstep(uLitRadius, uLitRadius - 30.0, cityDistance);
float crest = smoothstep(-0.2, 1.0, vCausticUp);

outgoingLight += uWindowColor * diffuseColor.rgb * cityLit * (0.25 + crest * 0.35);
