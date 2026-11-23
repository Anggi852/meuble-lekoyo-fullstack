import { env } from './config/env.js';
import { db } from './db/index.js';
import { createApp } from './app.js';

async function start() {
  await db.init();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`==================================================`);
    console.log(`Meuble Le'Koyo API berjalan di http://localhost:${env.port}`);
    console.log(`Swagger Docs   : http://localhost:${env.port}/api-docs`);
    console.log(`Database Mode  : ${db.mode}`);
    console.log(`Gen AI Proxy   : ${env.genaiApiUrl || 'Fallback Backend Engine (siap disambungkan)'}`);
    console.log(`==================================================`);
  });
}

start().catch((err) => {
  console.error('Gagal memulai server:', err);
  process.exit(1);
});
