# Caso práctico final – Aseguramiento de la calidad

Sistema bajo prueba: **OWASP Juice Shop 20.4.0-SNAPSHOT** (<https://github.com/juice-shop/juice-shop>).
Informe entregable: [`Informe_Caso_Practico_Final.pdf`](Informe_Caso_Practico_Final.pdf).

## Estructura

| Carpeta | Contenido |
|---|---|
| `pruebas/` | Scripts: Playwright (`tests/`), casos manuales guiados (`manual/`), k6 (`rendimiento/`), cobertura (`cobertura/`), parche de DEF-001/002 (`correcciones/`), CI propuesto (`ci/qa.yml`), `sonar-project.properties` |
| `evidencias/` | Capturas, reportes HTML/JSON, logs, informes de ZAP y SonarQube, `registro-defectos.csv` |
| `informe/` | Generador del PDF (lee los resultados reales de `evidencias/`) |
| `sistema/juice-shop/` | Clon local del repositorio analizado (commit `266448a`); **no está en este repositorio** (excluido por `.gitignore`, ver nota abajo) |

## Cómo reproducir

Requisitos: Docker Desktop, Node.js 22+ y Git. Los puertos 3000 y 9000 estaban ocupados en la máquina de trabajo, por eso se usan 3100 y 9100.

```bash
# 1. Sistema bajo prueba
docker run -d --name juice-shop -p 3100:3000 bkimminich/juice-shop:latest

# 2. Pruebas automatizadas y casos manuales guiados (Playwright 1.65.1 con Node 24)
cd pruebas && npm install && npx playwright install chromium
npx playwright test                      # 21 casos automatizados -> evidencias/automatizadas/
node manual/ejecutar-manuales.mjs        # 16 casos manuales con capturas -> evidencias/manuales/

# 3. Prueba de carga (k6, 20 usuarios, 80 s)
docker run --rm -v "$PWD/rendimiento:/scripts" grafana/k6 run --summary-export=/scripts/resumen-k6.json /scripts/carga-busqueda.js

# 4. Informe PDF
cd .. && node informe/capturas.mjs && node informe/generar-informe.mjs
```

SonarQube (análisis estático): `docker run -d --name sonarqube -p 9100:9000 sonarqube:community`, crear el proyecto `juice-shop` y un token, y ejecutar `sonarsource/sonar-scanner-cli` con `pruebas/sonar-project.properties` (ver anexos del informe).
OWASP ZAP (análisis dinámico): `zaproxy/zap-stable` con `zap-full-scan.py -t http://host.docker.internal:3100 -j -m 4` (ver `evidencias/zap/`).

## Notas importantes

- `pruebas/.credenciales-locales.txt` guarda la contraseña y el token de la instancia **local** de SonarQube. No lo publiques; está en `.gitignore`.
- `sistema/` tampoco está en este repositorio: es el clon del sistema bajo prueba, público en <https://github.com/juice-shop/juice-shop>, por lo que no hace falta duplicarlo aquí. El comando `git clone` del repositorio original recrea esa carpeta si se necesita volver a ejecutar algo contra el código fuente.
- Juice Shop contiene vulnerabilidades intencionales; ver la aclaración en la sección 2.3 del informe.
- MC-14 a MC-16 ya se reverificaron a mano el 21 y el 22 de noviembre (sección 9.3 y cronograma 5.9 del informe); si el sistema cambia de versión, conviene repetirlos de nuevo antes de reutilizar este material.
- Si se edita el informe, regenerar el PDF con `node informe/generar-informe.mjs` y subir el cambio con commit y push.
