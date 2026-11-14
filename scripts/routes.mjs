import { mkdir, copyFile } from 'node:fs/promises';

for (const route of ['omnecarta', 'moon', 'mars', 'compare', 'opportunity', 'lunar-rover', 'experiment', 'story', 'odyssey', 'collection']) {
  await mkdir('dist/' + route, { recursive: true });
  await copyFile('dist/index.html', 'dist/' + route + '/index.html');
}
