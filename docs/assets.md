# Asset provenance

Public source links use the entries in the project brief. This file records the underlying datasets and production credits.

| Asset | Provenance |
| --- | --- |
| Moon color and relief | NASA Scientific Visualization Studio CGI Moon Kit 4720. LROC WAC natural color mosaic and LOLA elevation preview, adapted as an albedo map and relief bump map. Atlas facts and Apollo 15 landing coordinates come from NASA Space Science Data Coordinated Archive. |
| Earth color | NASA/Goddard Scientific Visualization Studio Blue Marble, visualization 2915, `bluemarble-2048.png`, converted to JPEG for the orbital overview. Internal production record: https://svs.gsfc.nasa.gov/vis/a000000/a002900/a002915/bluemarble-2048.png. The public source remains the supplied NASA archive entry. |
| Orbital motion | Kepler equation with NASA archive fact-sheet periods and eccentricities: Earth 365.256 days / 0.0167; Mars 686.980 days / 0.0935; Moon 27.3217 days / 0.0549. Mars inclination is 1.848°, Moon inclination 5.145°. Distances, body sizes, and starting phases are illustrative. This is not a live ephemeris or an n-body gravitational solver. |
| Mars color | Viking orbiter imagery processed by USGS, credited to NASA/JPL-Caltech. Published as Mars.jpg in NASA’s planetary image textures. The atlas links to the approved Viking mission and NASA archive records. |
| Opportunity | NASA VTAD’s MER_static model, embedded by the approved Spirit & Opportunity mission overview. Embedded textures were compressed for the web. Exhibit, story wreck, recovered components, workbench, and collection use the same source mesh. Component bounds isolate material groups from the original for highlighting and assembly. |
| Opportunity surface images | Eagle Crater panorama and March 2014 rover self-portrait, both published within the approved Spirit & Opportunity record. The app displays the NASA/JPL and partner credits beside each photograph. |
| Lunar Roving Vehicle | Original model built from NASA archive specifications and photographs. The tires use two crossing sets of wires and chevrons. The suspension, folding frame, seats, dish, batteries, and controls use separate geometry. |
| Apollo 15 photograph | NASA AS15-88-11901, published in the NASA Space Science Data Coordinated Archive’s Lunar Roving Vehicle article. |
| Fallback illustrations | Images rendered from the corresponding production globe or hardware model. |
| Astra | Original 3D model based on Bahar’s sketch. The homepage and mission portraits were rendered from the same model used in play and cutscenes. |
| Surface environments | Original sculpted ground, layered ridges, stones, sky, and lighting in Three.js. Both the freely explorable terrain and Odyssey scenery are reconstructions, not surveys of Hadley–Apennine, Meridiani Planum, or Perseverance Valley. Jumps use constant surface gravity: Moon 1.62 m/s², Mars 3.71 m/s². |
| Painterly surface grain | Original grayscale brush texture generated for this project, `painted-surface.jpg`. Triplanar material shaders combine this grain with original model materials and directional light. Arcane is an internal stylistic reference; no show frames, characters, or copyrighted texture assets are used in the app. |

NASA archive references for the public app are defined in [references.mjs](../src/references.mjs). The original art references stay outside the published site.

## Odyssey flight and clue records

`src/ship.ts` is an original expedition craft, with swept wings, twin engine pods, hydraulic landing struts, canopy framing, a hinged hatch, tread geometry, consoles, controls and a radar texture driven by the actual flight state. `public/media/ship-fallback.svg` is its original vector fallback. No third-party ship model is used.

The Optics, Power and Drive downlinks in `src/flight-state.ts` are fictional mission clues, labelled as such in the interface. The search is an illustrative triangulation model: scan positions, separation, bearing diversity and range control uncertainty. It is not a reconstruction of Opportunity’s historical final telemetry or a radar engineering model. Saved fixes retain their measured uncertainty and location on the surface.

Astra’s original rig animates binocular irises, a pivoting segmented neck, drape vertices, cable, legs and recovery arm. These are hierarchical Three.js transforms and cloth deformation, not a downloaded character rig. The same geometry appears on foot and at the workbench.
