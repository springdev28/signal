# >_signal · Omnecarta

Omnecarta is a free browser archive about NASA hardware left on the Moon and Mars. It was built for the NASA Space Apps storytelling challenge. The archive starts with the Moon, Mars, and Opportunity, with a dust and solar power experiment and Solaris, a fictional archive companion.

- [Open Omnecarta](https://springdev28.github.io/signal/)
- [Verification and walkthrough](docs/verification.md)

## Run locally

Use Node.js 24 and npm. No account or key is required.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

The TypeScript app uses Vite and Three.js. The production build writes static files to `dist/`, with a physical index file for each direct route. GitHub Pages passes the repository base path to Vite as `OMNECARTA_BASE`. No hackathon Global Offer was used.

For browser checks, run `npx playwright install chromium` and `npm test` after building. Set `OMNECARTA_TEST_URL` to check a public deployment, or `OMNECARTA_CHROME` to use an installed Chrome executable.

## Solaris

Solaris uses authored remarks, suggested questions, and source-linked answers from `src/catalog.ts`. Mute is stored on the device; milestones are shown once per tab session. No question text, personal data, or credentials are sent to a provider. The sample environment file documents the server-only settings reserved for a future integration after the team verifies a provider that permits this school-age application.

## NASA resources and credits

| Source | Where it is used |
| --- | --- |
| [NASA Mars Exploration Rovers: Spirit and Opportunity](https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/) | Challenge-listed primary source for Opportunity’s purpose, landing, past water evidence, and final communication. Also supports the power experiment and Solaris answers. |
| [NASA Opportunity mission history](https://science.nasa.gov/mission/mer-opportunity/) | Mission timeline, final location, instruments, and dust storm. |
| [NASA/JPL-Caltech rover model](https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/) and [NASA/JPL camera specifications](https://pds-imaging.jpl.nasa.gov/documentation/MER_camsis_v4_9-25-07.pdf) | Bundled 3D viewer, labeled fallback, and stereo camera callout. |
| [Final panorama](https://science.nasa.gov/resource/opportunity-legacy-pan-true-color/) and [Eagle Crater’s Berry Bowl](https://science.nasa.gov/resource/discovery-served-up-in-a-bowl/) | Credited images in the exhibit. |
| [March 2014 Opportunity self-portrait](https://science.nasa.gov/resource/self-portrait-by-freshly-cleaned-opportunity-mars-rover-in-march-2014/) | The experiment contrasts dust blown off the panels with airborne dust blocking light. The numerical model is illustrative. |
| [NASA Moon Facts](https://science.nasa.gov/moon/facts/), [NASA Mars Facts](https://science.nasa.gov/mars/facts/), and [Mars dune photo](https://science.nasa.gov/photojournal/curiositys-color-view-of-martian-dune-after-crossing-it/) | Destination guides, comparison, and imagery. |
| [Apollo 15 equipment](https://www.nasa.gov/image-article/apollo-15-lunar-module-rover/) and [Lunar Roving Vehicle record](https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063C) | Hadley–Apennine mission note and further reading. |
| [NASA Eyes](https://eyes.nasa.gov/apps/solar-system/) | External interactive destination views. |

Astra and Solaris are fictional. The Astra illustration is original concept art generated for this project. NASA media is credited where it appears. See [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).

The desktop expedition is a separate phase. The destination IDs, Opportunity record, model, and authored Solaris text can be reused in the game.
