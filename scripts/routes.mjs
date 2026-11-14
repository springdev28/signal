import { mkdir, copyFile } from 'node:fs/promises';
for (const route of ['moon', 'mars', 'compare', 'opportunity', 'lunar-rover', 'experiment', 'story', 'collection']) {
  await mkdir('dist/' + route, { recursive: true });
  await copyFile('dist/index.html', 'dist/' + route + '/index.html');
}
