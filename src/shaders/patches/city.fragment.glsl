// Atlantis wakes in a chain reaction from its heart: the stone takes on a soft glow, brightest on
// surfaces facing up towards the light, and flares as the light front passes it
float cityDistance = cityWakeDistance(vCausticWorld.xz - uCityCentre.xz);
float cityLit = smoothstep(uLitRadius, uLitRadius - 30.0, cityDistance);
float cityFront = smoothstep(14.0, 0.0, abs(cityDistance - uLitRadius)) * step(0.5, uLitRadius) * (1.0 - smoothstep(300.0, 400.0, uLitRadius));
float crest = smoothstep(-0.2, 1.0, vCausticUp);

outgoingLight += uWindowColor * diffuseColor.rgb * (cityLit * (0.25 + crest * 0.35) + cityFront * (0.6 + crest * 0.6));
