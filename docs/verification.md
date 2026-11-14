# Phase 1 verification

The production build and eight Playwright checks passed in Chrome on November 14, 2026, against both the local production build and the [published site](https://springdev28.github.io/signal/). The tests use a desktop viewport and a Pixel 7 mobile viewport.

- Direct routes and navigation: archive, Moon, Mars, comparison, Opportunity, and experiment. Both NASA Eyes launch URLs returned HTTP 200 with the expected route; the separate NASA viewer’s destination scene was not verified.
- Rover exhibit: NASA model loads, keyboard controls rotate the view and select instrument details, and a forced model download failure leaves the credited fallback and instrument details usable.
- Experiment: at 100% dust, sunlight drops from 100% to 20% and net change moves from +55 to −25 units. Pause holds the battery, and Reset restores the starting conditions.
- Solaris: reacts to hardware and battery drain, answers suggested questions with a NASA source, and respects a persistent mute setting. Escape closes the dialog, returns focus, and can go up one level.

Record the walkthrough again with a preview running and `node scripts/walkthrough.mjs <output-folder>`. Install Chromium and the Playwright video recorder first with `npx playwright install chromium ffmpeg`.
