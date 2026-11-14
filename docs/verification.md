# >_signal verification

The browser checks cover desktop Chrome and a Pixel 7 viewport with emulated touch. The production build uses Node.js 24, TypeScript, Vite, and Three.js.

- Start at the homepage and use Explore to open either Omni-View or Odyssey. Explore exposes exactly those two links. Browse both worlds and hardware records without a saved mission, and verify that the collection stays empty.
- Open Apollo 15 on the Moon. The camera centers on Hadley–Apennine, the details show the published coordinates, and the marker disappears on the far side. Reset, keyboard orbit, touch orbit, and direct navigation are exercised.
- Rotate both rovers and select real component geometry. Verify that the selected geometry changes color and the side panel or phone drawer explains the part. Force an Opportunity model failure and check the matching fallback. Use the dust slider to update sunlight, solar output, the chart, and battery drain.
- Complete Odyssey with keyboard movement and emulated touch movement. Verify position-based scans, two landmark observations, recovery from three locations, timed retry and untimed input, incorrect mount and rotation feedback, successful fitting, and saved progress. Verify mouse and touch drag-to-fit on the mast separately.
- Reload My Collection after completing the mission. The craft appears once and can be rotated. Starting a replay keeps the collection.
- Open Solaris during the scanner cutscene and confirm the timer pauses until chat closes. Simulate a free-form response, switch views, and verify that the prior conversation and new context are sent. Test approved citations, bounded requests, rate limits, and the offline response of the production endpoint with a simulated upstream.

Inspect the homepage, Omnecarta, both worlds, both hardware exhibits, Odyssey search and workbench, and My Collection at desktop and phone widths. The screenshot script checks for horizontal overflow. Real provider responses require the team’s Workers AI credentials.
