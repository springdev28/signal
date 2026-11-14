# >_signal verification

Production build: `npm run build` passed. The browser suite passed **36 checks** using desktop Chrome and a Pixel 7 viewport with emulated touch. The final run used one worker and disabled automatic trace screenshots so capture overhead did not interfere with held flight controls. Interaction assertions remained enabled. The separate continuous recording uses the actual interface, without seeded progress, skipped stages, teleports or edits.

## Flight and clue-based recovery

- Start in the cockpit with Solaris. Interpret each of the fictional Optics, Power and Drive downlinks and select the region supported by its landmark clue. An incorrect region gives no usable fix.
- Steer, set throttle and take radar scans at three separated positions. A repeated stationary scan produces no progress. Scan counts, geometric baselines and bearing diversity narrow each contact’s uncertainty; locking requires at least three observations and uncertainty no greater than 5 m.
- Carry all three saved fixes through the approach, interactive landing and onto the surface. The test compares the complete saved contact records before and after touchdown. Keyboard and touch journeys both reach My Collection.
- Verify landing stabilization, timeout, retry and untimed input. Opening Solaris pauses the timer. The hatch opens after touchdown before Astra can step out.
- Walk within reach of all three parts, inspect their clues and recover them. Reject an incorrect workbench mount and orientation; rotate and seat each component in its proper mount. Collection is awarded only after assembly.
- With WebGL disabled, the ship illustration, clue records, radar and flight controls remain available. The ordinary rover and world fallbacks were also exercised.

## Atlas, existing routes and interface

The suite covers exactly two Explore choices, orbital time controls, Moon marker focus and far-side occlusion, rotation, pinch zoom, site scanning, surface exploration, selected hardware components, a dust/power graph, the retained direct surface mission route, saved progress, replay, keyboard and touch movement, drag-to-fit, dialog focus, shared Solaris conversation and offline hints. Layout assertions cover 320–1440 px widths, enlarged text, navigation overlap and horizontal overflow.

The production screenshot review includes the Moon, Mars, both hardware exhibits, free surface exploration, Odyssey workbench and collection at 1440 × 920 and 412 × 839. Cockpit screenshots cover the briefing and active controls at the same sizes. Artifacts are under `artifacts/flight-release/` and `artifacts/flight/` in the working checkout; generated screenshots and videos are excluded from Git.

`node scripts/check-flight-context.mjs` passed. With a simulated provider, it verifies that Solaris receives the flight phase, scanned records and uncertainty, while unknown fields and record IDs are discarded. This test does not establish live AI availability.

## Deployment

Target: [Hostinger temporary domain](https://lawngreen-donkey-344010.hostingersite.com/). See the release verification below for the final live checks and recording.

Solaris’s authored dialogue and hints are available throughout. Live free-form replies require `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the server environment; credentials are never included in client code. The flight, spacecraft downlinks and recovery story are fictional teaching simulations, not historical Opportunity telemetry or a validated flight dynamics model.

Release `01a1da61-95cf-71ae-8c06-6788bff87d14` completed on Hostinger with Node.js 24. All 11 routes returned HTTPS 200 and referenced the verified release entry bundle, `index-i2g5pImE.js`, including both `/odyssey/` and `/story/`. The live `/api/solaris` status reports `live: false`; authored mission guidance works, but live free-form AI responses are not configured.

After the final workbench readability adjustment, both desktop and touch recovery/assembly regression journeys passed again (2 checks). The selected part’s fitting clue appears beside the fit controls; inventory keeps legible part and state columns. The live continuous cockpit-to-collection recording is saved as `artifacts/flight/odyssey-continuous.webm`. The recording’s journey also rejects an incorrect clue region, a repeated stationary scan and an incorrect assembly mount before completing the mission.
