# Undertow

A scroll-driven three.js dive. Twenty years after marine biologist Mara Vale vanished, her beacon starts
calling again. Follow it down as her child, through six places, each darker than the last, under a storm:

1. **The Reef**: coral, turtles, her old dive marker under a buoy
2. **Kelp Cathedral**: light falling between swaying stalks
3. **The Wreck**: an old galleon on its side, her recorder in the sand
4. **The Whale Road**: open black water, and a humpback that leads you down
5. **The Drowned Temple**: a broken colonnade, a great gate, guardians that wake
6. **Atlantis**: a city that lights up again when you bring the light home

Scroll (or ↓ / Z) to dive. At five moments the dive pauses like a cutscene: drag to look around, then use the
glowing point to go on. Voiced narration, a procedural underwater soundscape, a dive-computer HUD.

Vue 3 + TypeScript (strict), Vite, Sass, three.js.

## Getting started

```bash
yarn install
yarn dev        # http://localhost:5173
yarn build      # type-check + production build
yarn lint       # eslint (strict TS rules) + prettier
```

### Assets

`public/assets` holds the final assets (sources in CREDITS.md). Models are authored in the frame the experience
places them in, so code only loads and places them:

- props stand on y = 0, centred on their footprint; buildings and statues face +Z;
- swimmers are centred on their body, head towards -Z, at their length in metres (fish 1, whale 15, turtle 1.3);
- the wreck lies along Z, 30 m long, without its sails; a kit of separate objects (the rune stones) has one mesh per
  object.

Meshes are meshopt-compressed (load with three's `MeshoptDecoder`), textures are WebP.

## Controls

| Input                    | Action                                                       |
| ------------------------ | ------------------------------------------------------------ |
| Scroll / ↓ / Z (W)       | Dive deeper (physical key: Z on AZERTY, W on QWERTY)         |
| ↑ / S                    | Swim back up                                                 |
| Drag                     | Look around while the dive pauses                            |
| Click the glowing point  | Continue the story                                           |
| P                        | Sonar ping: a ring of light outlines what's around you       |
| M / H                    | Sound on/off / controls                                      |

## Architecture

`src/ts/Core/Experience.ts` is the composition root: it loads the assets, builds the world from them and runs
the journey loop. The Vue layer only talks to that facade and its typed `EventBus` (`useExperience`).

```
src/ts
├── Core/            Experience (composition root), renderer, ticker, viewport, adaptive quality
├── Assets/          AssetLibrary: one LoadingManager for every loader, typed sources, awaitable load with progress
├── Journey/         Narration, the script (shots, stops, chapters), the rail, the director (progress, stops)
├── Camera/          Rail camera (breathing, parallax, look-around at stops), head lamp
├── World/
│   ├── Water/       Shared water uniforms + caustics, storm surface (Snell's window, lightning), shafts, snow, backdrop
│   ├── Terrain/     Textured canyon heightfield (sand, triplanar rock, coral rubble)
│   ├── Life/        Fish schools, kelp, jellyfish, whale (all GPU-animated), the rigged turtle
│   ├── Scenes/      The six places: grounded, path-cleared instancing of scanned models
│   ├── Materials/   Triplanar patch; Props/ procedural city buildings
│   ├── Lighting/    Sun + hemisphere, generated light probe (IBL), fog/atmosphere
│   └── Effects/     Mara's trail of light, hotspot beacon, exhale bubbles
├── Environment/     Depth → light blending, the storm, shelter zones
├── PostProcessing/  Half-res bloom → underwater lens (refraction, lamp scatter, fade)
├── Audio/           Voice player (per-speaker processing), underwater bus, ambience, effects
├── Services/        Typed EventBus, ScrollInput (wheel/touch/keys, layout-agnostic)
└── Components/      Atomic UI: Sass tokens, Fundaments, Atoms, Molecules, Organisms
src/shaders          GLSL (vite-plugin-glsl, #include); patches/ are injected into built-in materials
```

## Performance

- Everything that moves in numbers moves on the GPU: fish, kelp, jellyfish, snow and light shafts.
- Scanned props are simplified to a few thousand triangles and instanced; scenes out of range are hidden.
- One forward pass, no shadow maps, half-res bloom; lights fade instead of toggling (no shader recompiles).
- Shaders compile up front; pixel ratio is capped at 1.5 and `AdaptiveQuality` trades resolution for frame rate.

## Credits

See [CREDITS.md](CREDITS.md). Models from Poly Haven (CC0), the Smithsonian (CC0), Khronos (CC0) and Sketchfab
artists (CC BY 4.0). Voices generated with ElevenLabs.
