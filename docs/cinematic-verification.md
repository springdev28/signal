# Cinematic gameplay rebuild — 14 November 2026

## What changed

Odyssey now stages the player inside a full-window windshield with camera-space cockpit framing and a physical lower console. Its circular heading-up radar draws the live ship position, clue regions, scan uncertainty and locked contacts. Steering banks the ship; throttle controls speed and engine output. Optics, Power and Drive clues must be interpreted before separated scan positions can resolve each contact.

The landing approach retains all three measured fixes. The player stabilizes descent, waits for dust and the hatch, then walks out as Astra. The walking valley is 70 metres across and uses the same position bounds for movement, saves, map coordinates and ship exit. The trailing camera frames the twin spires. One waypoint and an in-range interaction remain visible; records, map and charts open on demand. Captions expire and the transcript remains in Solaris.

The ground is continuous shaped geometry with eight distinct ridges, layered silhouettes, original painted rock materials, warm directional light and cool shadows. Astra uses the shared articulated rig and separate material maps. The ship and cockpit have worn surfaces and functional lighting. The workbench is a physical metal platform with an inspection lamp, keyed mount controls and animated rotation/seating. It remains rotatable while its nonmodal tools are open. Completion uses a compact action panel so the finished rover remains visible.

## NASA data and original art

The Moon uses the complete 4096 × 2048 LROC color mosaic and relief derived from the 5760 × 2880 LOLA elevation dataset. The conversion preserves the documented height scale, offset and lunar radius. Opportunity's exhibit, wreck, parts and assembly share NASA VTAD geometry. See [asset provenance](assets.md) and the reproducible `scripts/prepare-lunar-relief.py` conversion.

The valley, spacecraft downlink clues, ship and Astra are original fictional reconstructions; they are not presented as surveyed terrain or Opportunity's historical final telemetry. Public source links remain on the supplied NASA allowlist. The original rock texture was generated with the built-in imagegen tool and saved at `public/media/painted-strata.jpg` and delivered as a lossless WebP; its complete prompt is in [rock-material-prompt.txt](rock-material-prompt.txt).

## Verification

- Production build: `npm run build` (TypeScript and Vite).
- Full earlier browser run: 46 checks, with 24 unaffected atlas, simulation and layout checks passing. Five gameplay/test-driver failures were corrected and rerun; the superseded run log is retained for the audit trail.
- Gameplay and movement rerun: **22/22 passed**, desktop Chrome and Pixel 7 viewport/touch emulation. Both full journeys use real steering and walking inputs, separated scans, saved locks, interactive touchdown, pickups, incorrect-fit rejection, correct rotations, assembly and collection.
- Final cinematic and completion panels: **8/8 passed**, including caption clearing, one waypoint, optional tools, model rotation with the workbench open and completion-panel size.
- Atlas checks cover Apollo 15 coordinates and far-side marker occlusion, hardware rotation/highlighting and model-load fallback. Layout checks include 320 px widths, touch targets, enlarged text, focus restoration and horizontal overflow.
- Full-size rendered frames: cockpit, Mars ground, Moon, Mars, Opportunity, Lunar Roving Vehicle and workbench at desktop and phone sizes. `scripts/review-gameplay.mjs` and `scripts/inspect-flight.mjs` check page/shader errors and overflow.
- Continuous recording uses `scripts/record-flight.mjs`; it does not seed mission progress or teleport the player. The optional visible landing guide is used to align the approach.

The final Figma identity pass uses the original inverse wordmark and app-icon SVG exports. Their natural dimensions and aspect ratios were checked in the rendered app at 320, 412 and 1440 px. A 320 px navigation wrap was corrected; the desktop and phone layout checks then passed (seven passing checks from the full run, plus the corrected narrow-layout check rerun). No logo geometry was redrawn.

## Verified deployment

- Temporary domain: https://lawngreen-donkey-344010.hostingersite.com/
- Hostinger build: `01a1dabb-22c7-7336-b626-6caed945b31e`, completed 14 November 2026 at 15:44:38 UTC.
- All **11 browser routes** return HTTP 200 and the tested production entry, `assets/index-Z2vUDSLv.js`.
- Both logo SVGs, Moon color/elevation/normal maps, Mars color, painted strata and NASA MER GLB have SHA-256 hashes identical to the tested local files.
- A deployment check caught CDN resizing of JPEG images. Runtime Moon, Mars and strata textures now use lossless WebP; the delivered Moon color map retains all **4096 × 2048 pixels**.
- `/api/solaris` responds with `live: false`; no provider credential was introduced or exposed. Authored in-character guidance and persistent context remain available.

The final uninterrupted recording is **160.12 seconds**, 1280 × 800 at 25 fps, and includes the new Figma logo. The actual-input journey completed briefing, clue interpretation, separated scans, three saved locks, approach, interactive touchdown, Astra exit, three recoveries, a rejected fit, correct rotation/seating, and My Collection. No mission progress or player position was seeded for this recording. Output: `artifacts/flight/odyssey-continuous.webm`. Consecutive frames and full-size stage captures were reviewed.

The deployed app was then captured at 1440 × 920 and Pixel 7 phone dimensions for the ground scene, workbench, Moon, Mars, Opportunity and Lunar Roving Vehicle: **12/12 views completed with no page/shader errors or horizontal overflow**. The WebP delivery and Figma assets were checked on the live domain. Verification artifacts are in `artifacts/cinematic/`.

The published release uses the isolated, tested source snapshot. Gameplay, texture and logo changes were merged back into the shared workspace with baseline hash checks. Concurrent edits to Astra's rig/materials and its study view were retained; the shared workspace production build also passes.

## Practical limits

The orbital model uses Keplerian paths with illustrative scale and phases, not live ephemerides or an n-body solver. The flight and scan model is an educational game simulation. Phone checks use browser device/touch emulation, not a physical-device performance benchmark. Solaris remains one action away with persistent context and authored hints; live free-form responses require a server-side provider credential, which was not configured in this release.
