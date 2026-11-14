import { defineConfig, devices } from '@playwright/test';
const base=(process.env.OMNECARTA_BASE ?? '').replace(/\/$/, '');
const origin=process.env.OMNECARTA_TEST_URL ?? 'http://127.0.0.1:4173'+base+'/';
export default defineConfig({
  testDir:'./tests',
  timeout:45000,
  use:{baseURL:origin, trace:'retain-on-failure', launchOptions:{
    ...(process.env.OMNECARTA_CHROME ? {executablePath:process.env.OMNECARTA_CHROME} : {}),
    args:['--enable-unsafe-swiftshader'],
  }},
  projects:[
    {name:'desktop',use:{...devices['Desktop Chrome']}},
    {name:'mobile',use:{...devices['Pixel 7']}},
  ],
  webServer:process.env.OMNECARTA_TEST_URL ? undefined : {command:'npm run preview -- --host 127.0.0.1 --strictPort',url:origin,reuseExistingServer:false},
});
