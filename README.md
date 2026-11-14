# >_signal

Open Explore to enter Omni-View or Odyssey. Omni-View opens Omnecarta’s Moon and Mars atlas and hardware exhibits. Odyssey is a fictional recovery mission with Astra and Solaris. Mission progress and My Collection are saved on the device.

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
