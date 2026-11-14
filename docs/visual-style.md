# Visual style and layout

Companion to the [project brief](https://docs.google.com/document/d/17GIOaAQ1eIh2GBGRJg3RehkcSRpO8ScoTxvV-g6ppIo). The shared interface values live in `src/tokens.css`; responsive rules live in `src/style.css` and `src/story.css`.

>_signal feels like a quiet observatory: a spacious 3D stage, restrained instrument panels, and clear readings. Use this shared visual system across the homepage, Omnecarta, Odyssey, and Solaris. Each panel must support a decision, an action, or understanding of the subject.

## Art direction

Keep Astra’s sketch silhouette consistent in the portrait and 3D model. Use pale ceramic binocular housings, a teal drape, dark mechanical joints, small brass details, and restrained cyan lens lights. Solaris uses one abstract signal icon and caption/chat treatment; Astra remains the playable character.

Render fictional Odyssey terrain with simplified rock forms, matte surfaces, warm rust and ochre on Mars, and readable silhouettes. Keep Moon imagery neutral gray. Preserve the proportions and provenance of scientific artifact models and NASA images. Label fictional recovery scenes and explanatory illustrations; do not present them as mission photography.

## Interface palette

Colors describe interface meaning across both modes. Natural terrain and source imagery retain their own colors. Neutral dividers separate content; the stronger border identifies control edges. Use dark ink (#080C10) on cyan-filled buttons.

| Role | Color | Use |
| --- | --- | --- |
| Page | #090D11 | Background behind the interface |
| Panel | #0D141A | Objective, facts, captions, and dialogs |
| Raised surface | #131F27 | Inputs and secondary controls |
| Primary text | #E7EDF0 | Headings and readable body copy |
| Secondary text | #A0B1BA | Supporting labels and chart axes |
| Interactive | #89E0E4 | Primary actions, selection, and focus |
| Emphasis | #A9EEF0 | Hover and highlighted readings |
| Warning | #EFBA78 | Actionable warnings with an explanation |
| Control border | #526B78 | Visible control boundaries |
| Divider | #273B46 | Non-interactive separators and plot grids |
| Landmark | #B8C6CF | Neutral map markers with letter labels |

## Typography and geometry

Use Barlow Condensed 600 for the wordmark and large page titles, Inter 400/600 for text and controls, and IBM Plex Mono 500 for coordinates, units, and chart readings. Set body text at 16 px, compact panel text and controls at 14 px, and supporting labels at 13 px minimum. Let titles scale with screen width. Use 1.5–1.65 line spacing for prose and allow labels to wrap.

Use a 4 px spacing unit: 4–8 px between related controls, 12–16 px panel padding and gaps, and 24–32 px between sections. Use 1 px borders and a 2 px control radius. Buttons and camera controls have at least a 44 × 44 px target. Keep display type out of dense tables and paragraphs.

## Screen composition

- Homepage: a darkened horizon behind the introduction, Astra beside it, and one Explore menu containing Omni-View and Odyssey. Keep the subject and text in separate layout columns; stack them on phones. The shared header contains My Collection and Solaris.

- Omnecarta: the Moon and Mars choices lead to the world guides. World and artifact views use a title row, a central 3D viewport, and a separate camera-control row. Place facts or component details in the right rail. Timeline, evidence, and comparison content sit below or outside the viewport.

- Odyssey: objective and clues on the left, the terrain or workbench in the center, and map/scanner or assembly tools on the right. Put camera controls above the canvas and Solaris captions below it in normal document flow. Movement and contextual actions follow the caption. Change the active tools with the mission phase.

- My Collection: reuse the exhibit frame and component vocabulary. Show only completed recoveries. Public browsing, selected parts, collected parts, and fitted parts are separate states.

## Responsive layout and layering

At 1200 px and above, Odyssey uses three columns. At 901–1199 px, move its objective above the scene and retain one tool rail. At 900 px and below, stack mission tools below the scene with Map & scanner and Back to controls links. Omnecarta uses a single details drawer at these widths. At 620 px and below, place the brand and Solaris on the first header row and navigation on the second.

Reserve space for captions, camera controls, and navigation. Never position them over the scene’s interactive area. Menus and dialogs are intentional overlays: they must stay within the viewport and scroll internally when needed. Opening Solaris hides any underlying task dialog, pauses timed actions, and restores that dialog and focus when closed. Keep one Solaris entry point; move it into the active task dialog when needed.

Use flexible grid tracks and wrapping controls. Keep the page free of horizontal scrolling at 320 px width and with enlarged text. Size chart labels in CSS pixels, redraw charts when their container changes, and reduce tick density before shrinking type. Keep units, legends, and a readable numeric or text alternative.

## States, feedback, and motion

Use cyan fill for the primary action, a bordered dark surface for secondary actions, and an underlined text link for navigation. Selected components show a checkmark and matching model highlight. Collected and Fitted use explicit labels; warnings use amber plus an explanation. Provide visible keyboard focus, disabled, loading, unavailable, and empty states using the same components in every mode.

Use 160 ms color transitions for controls. Scan, pickup, fitting, and reconstruction motion must show an actual state change. Respect reduced motion, preserve captions, and provide untimed actions. Avoid decorative telemetry, flashing backgrounds, or repeated status tags.

## Internal layout reference

The screenshot retained in the project brief is an internal mood and composition reference. The palette, type, spacing, responsive rules, and original >_signal components defined above govern implementation. Do not reproduce its dense labels, third-party branding, or unrelated graphics.
