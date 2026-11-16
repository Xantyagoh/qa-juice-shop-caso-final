// Captura los dashboards de SonarQube (instancia local en :9100) como evidencia del informe.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '../evidencias/sonarqube');
fs.mkdirSync(OUT, { recursive: true });
const cred = Object.fromEntries(
  fs.readFileSync(path.join(here, '.credenciales-locales.txt'), 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map((l) => l.split(/=(.*)/s).slice(0, 2)),
);
const SONAR = 'http://localhost:9100';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1250 } });
const page = await ctx.newPage();
await page.goto(`${SONAR}/sessions/new`);
await page.locator('input[name="login"]').fill(cred.sonarqube_user);
await page.locator('input[name="password"]').fill(cred.sonarqube_password);
await page.locator('button[type="submit"]').click();
await page.waitForLoadState('networkidle');

const vistas = [
  ['01_resumen', `/dashboard?id=juice-shop`],
  ['02_vulnerabilidades', `/project/issues?id=juice-shop&types=VULNERABILITY&resolved=false`],
  ['03_bugs', `/project/issues?id=juice-shop&types=BUG&resolved=false`],
  ['04_code_smells', `/project/issues?id=juice-shop&types=CODE_SMELL&resolved=false`],
  ['05_medidas', `/component_measures?id=juice-shop`],
];
for (const [nombre, ruta] of vistas) {
  await page.goto(SONAR + ruta);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);
  // Quitar el aviso flotante de SonarQube y mostrar los totales del código completo (no solo "New Code")
  await page.getByText('Get the most out of').first().waitFor({ timeout: 5000 }).catch(() => {});
  const dismiss = page.getByRole('button', { name: 'Dismiss' });
  if (await dismiss.count()) await dismiss.first().click().catch(() => {});
  await page.waitForTimeout(500);
  if (nombre === '01_resumen') {
    await page.getByText('Overall Code', { exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(2500);
  }
  await page.screenshot({ path: path.join(OUT, `${nombre}.png`), fullPage: nombre === '01_resumen' });
  console.log('captura', nombre);
}
await browser.close();
