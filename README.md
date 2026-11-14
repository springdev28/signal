# >_signal

Open Explore to enter Omni-View or Odyssey. The browser is a full-screen simulation: choose a world in the moving orbital overview, approach it, scan a landing site, and deploy Astra onto its surface. Omni-View opens Omnecarta’s Moon and Mars atlas and freely inspectable hardware. Odyssey starts inside the survey ship. Interpret three damaged downlink records, fly and compare radar bearings, lock the parts, land, and recover them as Astra before assembling the rover. Surface exploration, mission progress, and My Collection are saved on the device.

Drag to orbit, scroll or pinch to zoom, and use the camera buttons to reset. The orbital canvas also accepts arrow keys, +/−, and Home when focused. On the surface, use WASD, arrows, the touch pad, or tap the terrain to walk; Space jumps and E scans. Set a waypoint from the map. In Odyssey’s cockpit, WASD or arrow keys steer, Q/E changes throttle, B brakes and Space scans. Each record needs a matching search region and at least three scans from positions separated by 8 m. Wider bearing angles tighten uncertainty. Lock at 5 m or less, then fly the landing approach or use the optional guide. Landing offers timed stabilization, retry and untimed input. On foot, use the retained waypoint fixes and recover parts within reach. At the workbench, match the component, mount and orientation.

The orbital model solves Kepler’s equation using NASA archive periods and eccentricities. Body sizes and distances are compressed and the epoch is illustrative. Surface environments are original artistic reconstructions. See the provenance record for these distinctions.

[Open the Hostinger build](https://lawngreen-donkey-344010.hostingersite.com/) · [Verification](docs/verification.md) · [Visual style](docs/visual-style.md) · [Asset provenance](docs/assets.md)

```sh
npm ci
npm run dev
npm run build
npm start
```

Use Node.js 24. The production server serves the build and the same-origin `/api/solaris` endpoint. Vite builds physical index files for direct routes, including the older `/story/` route. The GitHub Pages mirror serves the static experience and authored Solaris notes.

Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the server environment to enable Workers AI. Never use a `VITE_` prefix for a credential. The endpoint uses the Mistral Small 3.1 24B Instruct model, a short conversation window, and NASA excerpts selected for the current view. The server applies request, per-client, and daily limits and keeps raw chats out of logs. Solaris’s authored notes, dialogue, and hints work when the endpoint is unavailable. See [.env.example](.env.example).

For browser tests, install Chromium with `npx playwright install chromium`, build, and run `npm test`. Set `OMNECARTA_TEST_URL` to run against a deployed build. With the production server running, use `node scripts/capture-views.mjs` to capture desktop and phone screenshots.

The team used its existing Hostinger plan for deployment. No Space Apps Global Offer was used.

Record an uninterrupted cockpit-to-collection journey with `OMNECARTA_TEST_URL=http://127.0.0.1:4173/ node scripts/record-flight.mjs`. The test uses actual controls and no mission-state shortcuts. It writes a WebM and scene screenshots to `artifacts/flight/`.

### PlayCanvas Odyssey

`/odyssey/` now runs the standalone PlayCanvas Engine. Start a fresh Mars flight with `/odyssey/?replay=1`, or the Moon chapter with `/odyssey/?chapter=moon&replay=1`. The existing atlas, orbit simulation and hardware routes remain available. `/omnecarta/?resource=apollo` opens the 13-group NASA mission library.

Flight: A/D steer, W/S adjust throttle, U/J change altitude, E scans, L locks, Space brakes, M opens the optional record. Touch controls align with the modeled console. Scans require separated positions; locks carry through landing to ground recovery. Walk with WASD, recover nearby parts with E, and bring them to the field workbench. Rotate parts and choose their keyed mounts, or drag an aligned part toward its mount. Only completion awards the artifact.

`npm run build` builds the production app. `scripts/pc-journey.mjs` pilots an actual fresh-session journey using browser input; `PC_RECORD=1` records it, and `PC_CHAPTER=moon` selects the Moon. `PC_URL` selects the server. `tests/playcanvas.spec.ts` covers input, touch, retry/untimed landing, Solaris pause and model fallback. The older flight tests target the replaced renderer and are retained as legacy references, not the current Odyssey acceptance suite.
