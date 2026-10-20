// Atlantis glows in a ring spreading from its heart as it wakes: windows on walls, a soft glow on everything.
// Even asleep, a few windows burn faintly, so the city's silhouette shows in the dark.
float cityDistance = length(vCausticWorld.xz - uCityCentre.xz);
float cityLit = smoothstep(uLitRadius, uLitRadius - 30.0, cityDistance);

vec2 cell = vec2((vCausticWorld.x + vCausticWorld.z) * 0.85, vCausticWorld.y * 0.65);
float windowShape = step(0.55, fract(cell.x)) * step(0.45, fract(cell.y));
float windowChance = hash21(floor(cell));
float wall = 1.0 - smoothstep(0.3, 0.6, abs(vCausticUp));

float awake = windowShape * step(0.45, windowChance) * cityLit;
float asleep = windowShape * step(0.93, windowChance) * 0.35;

outgoingLight += uWindowColor * (max(awake * 2.2, asleep) * wall + diffuseColor.rgb * 0.18 * cityLit);
