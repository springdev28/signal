import { createApp } from './app.mjs';

const port = Number(process.env.PORT || 4173);
createApp().listen(port, process.env.BIND_HOST || '0.0.0.0');
