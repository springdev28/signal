# Omnecarta

Omnecarta is a browser app for the NASA Space Apps storytelling challenge. Explore the Moon and Mars in the public archive, or play Astra’s fictional mission to find and rebuild Opportunity. The story and My Collection save progress on the device.

- [Open Omnecarta](https://lawngreen-donkey-344010.hostingersite.com/)
- [Verification record](docs/verification.md)

Use Node.js 24 and npm.

```sh
npm ci
npm run dev
npm run build
```

Vite builds the TypeScript and Three.js app into `dist/`. Each direct route has its own index file. GitHub Pages builds under the repository path. Hostinger builds the same source at the root of its temporary domain. The team used its existing Hostinger Cloud plan. No Space Apps Global Offer was used.

To run browser checks, install Chromium with `npx playwright install chromium`, build, then run `npm test`. Set `OMNECARTA_TEST_URL` to test a published build.

## NASA records and artwork

- [NASA Space Science Data Coordinated Archive](https://nssdc.gsfc.nasa.gov/) supplies the planetary references used in the Moon and Mars guides and comparison.
- [NASA Lunar Roving Vehicles](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C) informs the Apollo 15 exhibit and its original rover illustration.
- [NASA Spirit & Opportunity](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/) supplies the historical record, Eagle Crater panorama and March 2014 self-portrait used in the Opportunity exhibit and experiment.

The interactive rover and world illustrations were built for Omnecarta. Astra, Solaris, the Mars search and reconstructed parts are fictional. The dust experiment uses illustrative values. Solaris uses authored dialogue and hints with no provider configuration.
