import { db } from '../src/db/index.js';
import { createApp } from '../src/app.js';

const app = createApp();
let initPromise = null;

export default async function handler(req, res) {
  if (!initPromise) {
    initPromise = db.init().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
  return app(req, res);
}
