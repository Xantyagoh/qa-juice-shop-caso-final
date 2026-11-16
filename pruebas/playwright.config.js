import { defineConfig } from '@playwright/test';

// Configuración de las pruebas automatizadas (Caso práctico final - Aseguramiento de la calidad)
// Sistema bajo prueba: OWASP Juice Shop 20.4.0-SNAPSHOT en Docker (puerto 3100)
// Variables opcionales:
//   BASE_URL      URL del sistema (por defecto http://localhost:3100)
//   RESULTS_DIR   subcarpeta de ../evidencias donde se guardan los resultados (por defecto "automatizadas")
const resultados = `../evidencias/${process.env.RESULTS_DIR || 'automatizadas'}`;

export default defineConfig({
  testDir: './tests',
  outputDir: `${resultados}/artefactos`,
  timeout: 60_000,
  workers: 1,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: `${resultados}/reporte-html`, open: 'never' }],
    ['json', { outputFile: `${resultados}/resultados.json` }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3100',
    viewport: { width: 1366, height: 800 },
    screenshot: 'on',
    trace: 'retain-on-failure',
    actionTimeout: 10_000,
  },
});
