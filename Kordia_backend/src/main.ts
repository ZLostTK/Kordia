import { existsSync } from 'fs';
import { resolve } from 'path';
import { buildApp } from './app.js';
import { config } from './config/env.js';
import { getDb } from './database/connection.js';

async function main() {
  // Setup directories and DB
  config.createDirectories();
  getDb();

  const app = await buildApp();

  // SSL
  const keyPath = resolve('./key.pem');
  const certPath = resolve('./cert.pem');
  const https = existsSync(keyPath) && existsSync(certPath) ? { key: keyPath, cert: certPath } : undefined;

  try {
    await app.listen({ host: config.host, port: config.port });
    console.log(`✓ ${config.appName} v${config.appVersion} iniciado`);
    console.log(`✓ Puerto: ${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
