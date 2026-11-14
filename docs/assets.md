# Asset provenance

Public source links use the entries in the project brief. This file records the underlying datasets and production credits.

| Asset | Provenance |
| --- | --- |
| Moon color and relief | NASA Scientific Visualization Studio CGI Moon Kit 4720. LROC WAC natural color mosaic and full LOLA unsigned elevation data, adapted as albedo, normal and physical displacement maps. Atlas facts and Apollo 15 landing coordinates come from NASA Space Science Data Coordinated Archive. |
| Earth color | NASA/Goddard Scientific Visualization Studio Blue Marble, visualization 2915, `bluemarble-2048.png`, converted to JPEG for the orbital overview. Internal production record: https://svs.gsfc.nasa.gov/vis/a000000/a002900/a002915/bluemarble-2048.png. The public source remains the supplied NASA archive entry. |
| Orbital motion | Kepler equation with NASA archive fact-sheet periods and eccentricities: Earth 365.256 days / 0.0167; Mars 686.980 days / 0.0935; Moon 27.3217 days / 0.0549. Mars inclination is 1.848°, Moon inclination 5.145°. Distances, body sizes, and starting phases are illustrative. This is not a live ephemeris or an n-body gravitational solver. |
| Mars color | Viking orbiter imagery processed by USGS, credited to NASA/JPL-Caltech. Published as Mars.jpg in NASA’s planetary image textures. The atlas links to the approved Viking mission and NASA archive records. |
| Opportunity | NASA VTAD’s MER_static model, embedded by the approved Spirit & Opportunity mission overview. Embedded textures were compressed for the web. Exhibit, story wreck, recovered components, workbench, and collection use the same source mesh. Component bounds isolate material groups from the original for highlighting and assembly. |
| Opportunity surface images | Eagle Crater panorama and March 2014 rover self-portrait, both published within the approved Spirit & Opportunity record. The app displays the NASA/JPL and partner credits beside each photograph. |
| Lunar Roving Vehicle | Original model built from NASA archive specifications and photographs. The tires use two crossing sets of wires and chevrons. The suspension, folding frame, seats, dish, batteries, and controls use separate geometry. |
| Apollo 15 photograph | NASA AS15-88-11901, published in the NASA Space Science Data Coordinated Archive’s Lunar Roving Vehicle article. |
| Fallback illustrations | Images rendered from the corresponding production globe or hardware model. |
| Astra | Original 3D model based on Bahar’s sketch. The portrait asset is rendered from the same model used in play and cutscenes; `scripts/portrait.html` is its authoring view. |
| Surface environments | Original sculpted ground, layered ridges, stones, sky, and lighting in Three.js. Both the freely explorable terrain and Odyssey scenery are reconstructions, not surveys of Hadley–Apennine, Meridiani Planum, or Perseverance Valley. Jumps use constant surface gravity: Moon 1.62 m/s², Mars 3.71 m/s². |
| Painterly surface grain | Original grayscale brush texture generated for this project, `painted-surface.jpg`. Triplanar material shaders combine this grain with original model materials and directional light. Arcane is an internal stylistic reference; no show frames, characters, or copyrighted texture assets are used in the app. |

NASA archive references for the public app are defined in [references.mjs](../src/references.mjs). The original art references stay outside the published site.

## Odyssey flight and clue records

`src/ship.ts` is an original expedition craft, with swept wings, twin engine pods, hydraulic landing struts, canopy framing, a hinged hatch, tread geometry, consoles, controls and a radar texture driven by the actual flight state. `public/media/ship-fallback.svg` is its original vector fallback. No third-party ship model is used.

The Optics, Power and Drive downlinks in `src/flight-state.ts` are fictional mission clues, labelled as such in the interface. The search is an illustrative triangulation model: scan positions, separation, bearing diversity and range control uncertainty. It is not a reconstruction of Opportunity’s historical final telemetry or a radar engineering model. Saved fixes retain their measured uncertainty and location on the surface.

Astra’s original rig animates binocular irises, a pivoting segmented neck, drape vertices, cable, legs and recovery arm. These are hierarchical Three.js transforms and cloth deformation, not a downloaded character rig. The same geometry appears on foot and at the workbench.

## Cinematic rebuild, 14 November 2026

The Moon atlas now loads the **complete 4096 × 2048 LROC color TIFF** converted to a browser texture, and normals/vertex displacement derived from the **5760 × 2880 LOLA unsigned elevation TIFF**. The runtime color texture is `moon-albedo.webp`, a lossless encoding of the prepared JPEG's pixels: the hosting CDN resizes JPEG responses, so WebP preserves the full resolution in production. Mars and the painted strata use the same delivery format. `scripts/prepare-texture-delivery.py` reproduces these encodings. `scripts/prepare-lunar-relief.py` records the half-metre conversion, 10 km offset, lunar reference radius, longitude convergence and fixed displacement range. Geometry uses physical relative elevations; normal strength is 1.35 for readability. The old low-resolution JPEG bump preview is no longer the atlas relief source. Source files were re-downloaded in full after the earlier local TIFFs failed integrity checks.

Internal dataset URLs (public citations remain the approved archive entry):
- https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_4k.tif
- https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16_uint.tif

`painted-strata.jpg` is original generated production art, used on the sculpted ridge meshes and twin spires. It is **not NASA imagery**. Built-in imagegen prompt: “Original seamless flat albedo game texture for layered sandstone/basalt; painterly animated science-fiction direction, muted warm gray with ochre/rust undertones, irregular strata, plate edges, dry-brush and palette-knife marks, restrained cracks, even diffuse light; no scene, text, grid, or copied show artwork.” The complete generation prompt is in `docs/rock-material-prompt.txt`.

The valley is an authored interpretation, with continuous ground and distinct sculpted rock formations. It remains labelled a fictional reconstruction rather than a mapped NASA landing-site survey. The flight evidence drawer displays the unmodified NASA Eagle Crater photograph and links to the approved Spirit & Opportunity record. Opportunity's exhibit, wreck, recovered components and assembled craft retain the NASA VTAD geometry. The cockpit is original camera-space 3D framing and physical lower-console geometry with accessible live instruments aligned to it.

## Project identity

The wordmark and browser icon are unmodified SVG exports of the user's [Figma logo](https://www.figma.com/design/6W7En8vWZ7eBIQzzTOEygW?node-id=1-29): inverse wordmark `1:29` (274 × 76) and dark app icon `1:59` (76 × 76). `public/brand/signal-wordmark.svg` preserves all authored layers; the header scales the complete artwork uniformly. `public/favicon.svg` is the matching app icon. These are project identity assets, not NASA assets.
