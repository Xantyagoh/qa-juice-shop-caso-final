// Toma capturas de los reportes HTML generados por las herramientas (Playwright y OWASP ZAP) para el informe.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../pruebas/node_modules/@playwright/test/index.mjs';
import { EVID, url, existe } from './lib.mjs';

const OUT = path.join(EVID, 'capturas');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const pw = path.join(EVID, 'automatizadas', 'reporte-html', 'index.html');
if (existe(pw)) {
  await page.goto(url(pw));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, 'reporte-playwright.png') });
  console.log('captura reporte-playwright');
}
const zap = path.join(EVID, 'zap', 'zap-informe.html');
if (existe(zap)) {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto(url(zap));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'zap-informe.png') });
  console.log('captura zap-informe');
}
await browser.close();
