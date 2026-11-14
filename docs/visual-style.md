# Visual specification

Companion to the [live project brief](https://docs.google.com/document/d/17GIOaAQ1eIh2GBGRJg3RehkcSRpO8ScoTxvV-g6ppIo). The supplied cockpit reference and Bahar’s Astra sketch remain authoritative. Preserve the full-screen simulation, flight/radar sequence, and concurrent implementation work. `src/simulation.css` owns scene composition; `src/tech-interface.css` defines the shared technical interface, typography, palette, and restrained Arcane material accents.

Use the supplied celestial illustration as an aesthetic reference for the live 3D experience: gold illumination, deep teal shadows, luminous edges, ink-like shading, and layered stars. Apply those qualities to rendered worlds, materials, lighting, and spatial effects; do not turn the reference into a static wallpaper. Keep the technical spacecraft interface precise and readable around the scene, using the supplied cockpit screenshot for instrument hierarchy. Preserve original >_signal art and NASA equipment silhouettes and identifying details.

## Art direction

Use semi-realistic rendering with restrained painted detail. Preserve continuous lighting, natural albedo, readable shadow detail, and the different responses of metal, cloth, glass, and rock. Keep visible brush grain subtle and attached to the 3D surface. Avoid posterized lighting, checkerboard patches, halftone shading, and artificial outlines. Warm highlights and cool shadows provide the Arcane influence. Retain recognizable craters and equipment, layered stars, and a subdued world-space nebula. Lunar terrain stays silver grey; Mars uses dusty ochre and cool distant ridges.

Stage Solaris dialogue and landing as short in-engine scenes. Give Astra a quiet idle performance through lens focus, neck glances, weight shifts, drape motion, and cable movement. Blend idle, walking, scanning, pickup, and assembly poses. Ease acceleration, braking, turns, and camera changes. Use short 140–240 ms interface transitions and respect reduced-motion preferences. Keep player control during flight and scanning, and restore it at the end of each scene.

## Palette and typography

Canvas #061019; translucent instrument panels #0A1924ED; raised controls #102735. Use primary text #DEEBF2 and secondary text #A2B9C5. Dark blue-black surfaces and fine framing give the interface the feel of a working spacecraft console while leaving the simulated world visible.

Use electric cyan #63D7E8 for interaction, focus, and selection; pale cyan #B9F3FB for emphasis; and amber #E9AF64 for actionable warnings. Brass #BC9566 accents frame corners and Solaris details. Use warm gold #F0CE89 and ivory #FFF0D2 for celestial illumination and scene identification. Fine borders use #375B6D and dividers #203B4A. Stylized lighting must preserve recognizable geography; NASA evidence images retain their original colors.

Use Barlow Condensed 600 for scene titles and cinematic dialogue headings, Inter for prose, navigation, and action labels, and IBM Plex Mono 500 for the wordmark, instrument headings, coordinates, and numeric readings. Keep instrument labels compact, use uppercase sparingly for identification, and align numerical readings with tabular digits. Reading text is around 14 px; essential controls and readings stay at least 13 px. Prose uses roughly 1.5 line spacing.

## Panels, controls, and feedback

Use compact instrument panels with 1 px rules, 2 px corners, subtle metal shading, and small brass and cyan corner marks. Keep the framing crisp around the painterly 3D scene. Panel headings form clear instrument strips; component selectors use consistent icons and names. Primary actions use cyan with dark text, secondary controls are dark and outlined, and selected rows add a cyan edge and an explicit checkmark. Keep button targets at least 44 × 44 px and consistent internal spacing. Decorative framing must not imply invented readings or obscure the subject.

Selected components show a checkmark, a matching model highlight, and one label connected to the selected part. Keep the annotation clear of camera controls. Show Collected and Fitted as explicit text states. Warnings explain the required action. Charts plot actual values with units, a legend, and a text reading; omit invented telemetry.

## Composition at each size

Use the full browser as the simulation interface, with a clear central view and compact translucent instruments around its edges. Group radar, flight controls, and the current contact in the cockpit. After landing, keep Astra and the terrain unobstructed; at the workbench, exchange navigation instruments for clues, inventory, and fit controls. Omnecarta uses the same instrument language around the artifact, with mission evidence available below.

On foot, WASD, arrows, and touch controls move relative to the camera heading. Forward moves into the view, and Astra turns smoothly toward travel. Keep the primary action visible and disclose maps, waypoints, and camera tools on demand. At 900 px and below, collapse secondary instruments into drawers. Reserve separate areas for the objective, camera, movement, current action, and captions. Use a compact header and accessible names for icon controls. Keep the selected contact or part visible when an instrument opens.

Keep one Solaris entry point, including inside a task drawer or dialog. Opening Solaris temporarily hides the underlying dialog; closing it restores the dialog and focus. Wrap long text and controls, let drawers scroll internally, and prevent horizontal overflow. At enlarged text sizes, allow vertical reflow instead of clipping.

## Character, imagery, and motion

Build original 3D meshes for Astra, the ship and cockpit, the terrain, and inspectable spacecraft and parts. Preserve Astra’s original binocular head silhouette, lenses, and segmented neck. The antennae use visible angular bends, and the curved cable tail ends in an articulated three-pronged claw. Use the supplied body reference for a narrow mechanical torso, exposed waist wiring, articulated limbs, small claw-like hands and feet, and a weathered open-front shoulder cape.

Use separate color, roughness, and relief maps for woven canvas, worn enamel, brushed steel, brass, and rubber. Show mechanical attachments at the shoulder axles, wrists, ankles, wire terminals, and tail socket. Keep the cape behind the moving arms, with a separate fold over the front shoulder. Check cloth faces as well as vertices for clearance. Keep the tail outside the arm swing and the soles planted on the ground during idle.

The interactive Astra preview supports mouse and touch orbit, scroll or pinch zoom, and live idle, walk, scan, and recovery poses. Animate joints, lenses, cloth, and the tail claw together, with readable lighting. Keep fictional reconstruction distinct from NASA evidence and place source credits alongside factual content.
