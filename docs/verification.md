# >_signal verification

The production build passed with Node.js 24. On the [Hostinger deployment](https://lawngreen-donkey-344010.hostingersite.com/), 24 Playwright checks passed in desktop Chrome and a Pixel 7 viewport with emulated touch. All 11 page routes, including `/story/` and `/odyssey/`, responded over HTTPS.

- Start at the homepage and use Explore to open either Omni-View or Odyssey. Explore exposes exactly those two links. Browse both worlds and hardware records without a saved mission, and verify that the collection stays empty.
- Open Apollo 15 on the Moon. The camera centers on Hadley–Apennine, the details show the published coordinates, and the marker disappears on the far side. Keyboard orbit, touch orbit, two-finger pinch zoom, reset, and direct navigation passed.
- Rotate both rovers and select real component geometry. The selected geometry changes color and the side panel or phone drawer explains the part. Loading failure for the Opportunity model and disabled WebGL for the Moon and both rovers showed matching illustrations. The dust slider updated sunlight, solar output, the chart, and battery drain.
- Complete Odyssey with keyboard movement and emulated touch movement. Verify position-based scans, two landmark observations, recovery from three locations, timed retry and untimed input, incorrect mount and rotation feedback, successful fitting, and saved progress. Verify mouse and touch drag-to-fit on the mast separately.
- Reload My Collection after completing the mission. The craft appears once and can be rotated. Starting a replay keeps the collection.
- Open Solaris during the scanner cutscene and confirm the timer pauses until chat closes. Simulate a free-form response, switch views, and verify that the prior conversation and new context are sent. Test approved citations, bounded requests, rate limits, and the offline response of the production endpoint with a simulated upstream.

Reviewed deployed screenshots of the homepage, Omnecarta, both worlds, both hardware exhibits, Odyssey search and workbench, and My Collection at 1440 px and 412 px widths. The screenshot script checked for horizontal overflow. Layout tests covered widths from 320 px through 1440 px and text enlarged to 200%.

Solaris’s authored notes and hints work on the deployment. Free-form responses, shared chat history, exhibit selection, and assembly context were verified with a simulated provider. Live responses require `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the Hostinger server environment.
