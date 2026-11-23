import { db } from '../src/db/index.js';
import { createApp } from '../src/app.js';

const app = createApp();
let initPromise = null;

async function ensureReady() {
  if (!initPromise) {
    initPromise = db.init().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}