# Undertow

An immersive three.js dive. Twenty years after marine researcher Mara Vale vanished, her beacon starts calling again.
Follow it down as her child, through six places, each darker than the last:

1. **The Reef**: sunlit shallows, turtles, her old dive marker
2. **Kelp Cathedral**: god rays falling between swaying stalks
3. **The Halcyon**: her research ship, explored by head lamp
4. **The Whale Road**: open blue nothing, and a humpback that leads you down
5. **The Drowned Temple**: a colonnade, an altar, guardians that wake
6. **Atlantis**: a city that lights up again when you bring the light home

Mind your air: it drains faster when you're deep or kicking hard. Swim into a bubble column to breathe.

Everything is procedural: no models, textures or audio files. Vue 3 + TypeScript (strict), Vite, Sass.

## Getting started

```bash
yarn install
yarn dev        # http://localhost:5173
yarn build      # type-check + production build
yarn lint       # eslint (strict TS rules) + prettier
```

## Controls

| Input            | Action                                                     |
| ---------------- | ---------------------------------------------------------- |
| W A S D / arrows | Swim & turn (ZQSD on AZERTY via physical key codes)        |
| Space / E        | Rise                                                       |
| C / Q            | Sink                                                       |
| Shift            | Kick hard (uses more air)                                  |
| F                | Head lamp                                                  |
| M                | Mute                                                       |
| Mouse drag       | Look around                                                |
| Touch            | Hold to swim, offset to turn, top/bottom bands rise & sink |

## Architecture

`src/ts/Core/Experience.ts` is the composition root: it builds every subsystem, injects dependencies through
constructors and runs the frame loop. The Vue layer only talks to that facade and its typed `EventBus`
(`useExperience` composable).

```
src/ts
├── Core/            Experience (composition root), renderer, ticker, viewport, adaptive quality
├── Contracts/       Interfaces: IDiverState, IEnvironmentAware, ICollider, ITerrainSampler…
├── Config/          World layout (canyon profile, scenes), diver & air tuning, depth light stops
├── World/
│   ├── Water/       Shared water uniforms + caustics patch, surface from below, light shafts, marine snow
│   ├── Terrain/     The canyon heightfield (drawn and collided from one function)
│   ├── Diver/       Model, physics, controller, head lamp, breathing rhythm
│   ├── Life/        GPU-animated fish schools, kelp, jellyfish; turtle and whale
│   ├── Props/       Shared geometries, everything static placed as instanced meshes
│   ├── Scenes/      The six places, each owning its props, life, colliders, vents and shards
│   ├── Colliders/   Sphere, column, box colliders and shelter zones
│   ├── Effects/     Air vents, exhale bubbles, the signal beacon
│   └── Collectibles/ Mara's light shards
├── Camera/          Spring follow camera (intro orbit, showcases, shake), pointer orbit
├── Environment/     Depth → light & fog blending, shelter, Atlantis illumination
├── Dive/            Oxygen, checkpoints, blackout sequence, session
├── Story/           Narrator, story director, the six-chapter script and its step types
├── PostProcessing/  Bloom (half res) → underwater lens (refraction, fringe, hypoxia, fade) → output
├── Audio/           Procedural WebAudio: ambience, depth drone, breathing, chimes, whale song
├── Services/        Typed EventBus, InputService
└── Components/      Atomic UI: Sass tokens, Fundaments, Atoms, Molecules, Organisms
src/shaders          GLSL (vite-plugin-glsl with #include); patches/ are injected into built-in materials
```

Key ideas:

- **Light is a function of depth.** `Config/environment.ts` defines the water at a few depths; `EnvironmentDirector`
  blends them by the diver's depth every frame and pushes the result to every `IEnvironmentAware` (fog, lights,
  caustics, god rays, particles, post). Inside the wreck or the temple a `ShelterZone` dims the sun.
- **Built-in materials, extended.** Instead of custom shaders everywhere, `patchMaterial()` injects GLSL from
  `src/shaders/patches` into Lambert/Basic materials, keeping three.js lighting, fog and instancing. Caustics,
  kelp sway, fish swimming, jellyfish pulses, whale undulation and the city lights are all patches.
- **The terrain you see is the terrain you hit.** `Seabed.heightAt()` builds the mesh and answers collision queries.

## Performance

- Everything that moves in numbers moves on the GPU: fish schools (one draw each), kelp, jellyfish, marine snow,
  light shafts and vent bubbles have no per-frame CPU cost.
- Static props are instanced and share geometries; the wreck and temple are merged into single meshes.
- Scenes out of fog range are hidden; the camera's far plane is 320 m.
- No shadow maps and no MSAA/SMAA; caustics and the lens pass carry the look. Bloom runs at half resolution.
- Lights never toggle visibility (that would recompile every lit shader): the head lamp and Atlantis' light fade
  their intensity instead.
- Shaders are compiled up front with `compileAsync`. Pixel ratio is capped at 1.5, and `AdaptiveQuality` lowers the
  render scale when frames run long and raises it again when there is headroom.

## Frontend

Atomic design with Sass, cascade layers (`fundaments → theme → atoms → molecules → organisms → layouts`),
tokens in `Components/Sass/_tokens.scss`, fluid sizing via `fluid()`, and data-attribute APIs
(`data-font-size`, `data-color`, `data-theme`, `data-flow`, `data-glass`, `data-rounded`, `data-wave`).
