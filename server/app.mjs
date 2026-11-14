import express from 'express';
import { fileURLToPath } from 'node:url';
import { createSolaris } from './solaris.mjs';

export function createApp(options) {
  const app = express();
  app.disable('x-powered-by');
  // Hostinger places one web server in front of this process.
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 'loopback, linklocal, uniquelocal');
  const solaris = createSolaris(options);
  app.get('/api/solaris',solaris.status);
  app.post('/api/solaris',express.json({ limit: '7kb' }),solaris.reply);
  app.use('/api',(_request,response) => response.status(404).json({ error: 'not found' }));
  app.use(express.static(fileURLToPath(new URL('../dist/',import.meta.url)), { index: 'index.html' }));
  app.use((error,_request,response,_next) => {
    const code = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    response.status(code).json({ error: code === 413 ? 'request too large' : 'invalid request' });
  });
  return app;
}
