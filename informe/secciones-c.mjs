// Secciones 10 a 13: seguridad, métricas, reflexión y anexos.
import path from 'node:path';
import { esc, tabla, insignia, fig, EVID, leerTxt, RAIZ, pct } from './lib.mjs';
import { REPO } from './secciones-a.mjs';

const owaspSonar = {
  'typescript:S6268': 'A03 Inyección (XSS)',
  'typescript:S1523': 'A03 Inyección (ejecución dinámica de código)',
  'typescript:S5332': 'A02 Fallas criptográficas (tráfico en claro)',
  'secrets:S6706': 'A02 Fallas criptográficas (secretos expuestos)',
  'typescript:S6437': 'A02 Fallas criptográficas (secretos expuestos)',
  'terraform:S5332': 'A02 Fallas criptográficas (tráfico en claro)',
  'terraform:S6258': 'A09 Fallas de registro y monitoreo',
  'typescript:S2245': 'A02 Fallas criptográficas (aleatoriedad débil)',
  'javascript:S4790': 'A02 Fallas criptográficas (hash débil)',
  'typescript:S4790': 'A02 Fallas criptográficas (hash débil)',
  'typescript:S5693': 'A04 Diseño inseguro (límite de tamaño)',
  'typescript:S4507': 'A05 Configuración incorrecta (depuración activa)',
  'javascript:S4036': 'A05 Configuración incorrecta (PATH)',
};

export function seccion10(ctx) {
  const s = ctx.sonar;
  const rules = ctx.sonarVulnPorRegla
    .map((r) => [`<code>${esc(r.regla)}</code>`, esc(r.mensaje), String(r.n), esc(owaspSonar[r.regla] || 'A05 Configuración incorrecta')]);
  const z = ctx.zap;
  const zapFilas = z.alertas.map((a) => [
    esc(a.nombre), insignia(a.riesgoEs), String(a.instancias), esc(a.owasp), esc(a.mitigacion),
  ]);
  return `
<section>
<h1>10. Pruebas de seguridad</h1>
<h2>10.1 Enfoque</h2>
<p>La evaluación se basó en el <strong>OWASP Top 10 (2021)</strong> y combinó cuatro fuentes complementarias: (1) <strong>análisis estático</strong> del código con SonarQube; (2) <strong>análisis dinámico</strong> de la aplicación en ejecución con OWASP ZAP; (3) <strong>casos de prueba de seguridad</strong> manuales y automatizados (MC-14 a MC-16, AT-15, AT-19 a AT-21); y (4) el análisis de impacto y mitigación de cada hallazgo. Todo se ejecutó sobre una instancia local desechable del sistema, sin tocar sistemas de terceros.</p>

<h2>10.2 Análisis estático (SonarQube)</h2>
<p>SonarQube Community ${ctx.sonarVersion} analizó ${s.ncloc} líneas de código (TypeScript, JavaScript, HTML y Terraform) del repositorio clonado. Resultado: <strong>${s.vulnerabilities} vulnerabilidades</strong> y <strong>${s.security_hotspots} security hotspots</strong>, con <strong>Security Rating ${ctx.ratingLetra(s.security_rating)}</strong>.</p>
${tabla(['Regla', 'Descripción del hallazgo', 'Ocurrencias', 'Categoría OWASP'], rules)}
<div class="galeria">
${fig(path.join(EVID, 'sonarqube', '02_vulnerabilidades.png'), 'Figura. SonarQube: lista de vulnerabilidades.', '100%')}
</div>
<p><strong>Interpretación.</strong> ${ctx.sonarVulnPorSev}. Lo más grave es la desactivación de la sanitización de Angular (9 bloqueantes), que explica técnicamente el XSS de MC-16, y las claves privadas versionadas en el repositorio. Parte de estos hallazgos son intencionales (Juice Shop es un entorno de entrenamiento), pero se reportan igual porque una herramienta de análisis estático no distingue intención y porque la misma configuración en un sistema real sería crítica.</p>
<p class="nota"><strong>Limitación de la herramienta.</strong> El propio dashboard de SonarQube Community Build advierte: "does not scan for critical injection vulnerabilities (SQL injection, XSS, and more)". Por eso el análisis estático <em>no</em> reporta la inyección SQL del login (DEF-003), que sí se comprobó con casos dinámicos (MC-15, AT-19); y solo señala indirectamente el XSS (sanitización desactivada, S6268). Es una razón concreta para combinar análisis estático, dinámico y pruebas dirigidas, y no depender de una sola herramienta.</p>

<h2>10.3 Análisis dinámico (OWASP ZAP)</h2>
<p>${esc(z.descripcion)}</p>
${z.alertas.length ? tabla(['Alerta ZAP', 'Riesgo', 'Instancias', 'Categoría OWASP', 'Mitigación recomendada'], zapFilas) : '<p class="aviso">No hay datos de ZAP disponibles.</p>'}
${fig(path.join(EVID, 'capturas', 'zap-informe.png'), 'Figura. Informe HTML generado por OWASP ZAP.', '100%')}
<p><strong>Interpretación.</strong> ${esc(z.interpretacion)}</p>

<h2>10.4 Pruebas de seguridad dirigidas (manuales y automatizadas)</h2>
${tabla(['Caso', 'Prueba', 'Resultado', 'Impacto potencial'], [
  ['MC-15 / AT-19', "Inyección SQL en el login con <code>' or 1=1--</code>", insignia('Fallido') + ' Acceso como <code>admin@juice-sh.op</code>', 'Toma de control de la cuenta de administrador y de todos los datos de la tienda.'],
  ['MC-16', 'XSS reflejado en el campo de búsqueda', insignia('Fallido') + ' Se ejecutó el script', 'Robo de sesión, suplantación y redirección de usuarios con solo compartir un enlace.'],
  ['AT-15', 'Control de acceso: leer el carrito de otro usuario', insignia('Fallido') + ' HTTP 200', 'Exposición de datos de otros clientes (IDOR).'],
  ['MC-14 / AT-06 / AT-09', 'Validación del lado del servidor (contraseña)', insignia('Fallido') + ' HTTP 201 con 4 y 41 caracteres', 'Cuentas con contraseñas triviales; evasión de reglas de la interfaz.'],
  ['AT-20', 'Cabeceras de seguridad', insignia('Fallido') + ' Sin CSP ni HSTS', 'Mayor impacto de XSS y de ataques de intermediario.'],
  ['AT-21', 'Listado de usuarios sin token', insignia('Aprobado') + ' HTTP 401', 'Control correcto.'],
])}
${fig(path.join(EVID, 'manuales', 'MC-15_paso2_resultado.png'), 'Figura. MC-15: tras la inyección SQL el sistema abre sesión como administrador.', '60%')}

<h2>10.5 Evaluación por categoría del OWASP Top 10 (2021)</h2>
${tabla(['Categoría', 'Evidencia obtenida', 'Riesgo', 'Mitigación'], ctx.owaspMatriz.map((o) => [`<strong>${esc(o.cat)}</strong>`, o.evidencia, o.riesgo ? insignia(o.riesgo) : (/^Evaluación parcial/.test(o.evidencia) ? 'Evaluación parcial' : 'No evaluado'), o.mitigacion]))}

<h2>10.6 Recomendaciones de mitigación priorizadas</h2>
<ol>
  <li><strong>Inmediato (críticos y altos):</strong> usar consultas parametrizadas en el login (DEF-003); reactivar la sanitización de Angular y evitar <code>bypassSecurityTrust*</code> (DEF-008, DEF-009); validar en el servidor que cada carrito pertenece al usuario del token (DEF-004); retirar las claves privadas del repositorio y rotarlas (DEF-010).</li>
  <li><strong>Corto plazo (medios):</strong> centralizar la validación de entrada en el servidor (longitudes, formato, rangos) con un esquema (por ejemplo Zod o Joi) para cerrar de una vez DEF-001, 002, 005 y 006; agregar Content-Security-Policy y HSTS con <code>helmet</code> (DEF-007); reemplazar algoritmos de hash débiles (DEF-011).</li>
  <li><strong>Mejora continua:</strong> incorporar SonarQube y ZAP al pipeline con <em>quality gate</em>, añadir análisis de dependencias (SCA) y monitoreo de registros.</li>
</ol>
<p class="nota"><strong>Limitaciones.</strong> No se ejecutó análisis de dependencias del servidor (A06): solo se evaluó parcialmente el frontend con la regla Retire.js de ZAP. A10 (SSRF) no se evaluó. El escaneo activo de ZAP se limitó a 10 minutos y SonarQube Community no analiza inyección SQL ni XSS, por lo que la ausencia de una alerta no prueba que la vulnerabilidad no exista (de hecho, ZAP no reportó el XSS ni el acceso por inyección del login que se confirmaron con casos dirigidos).</p>
</section>`;
}

export function seccion11(ctx) {
  const s = ctx.sonar;
  const L = ctx.ratingLetra;
  const r = ctx.resumen;
  const kloc = (Number(s.ncloc) / 1000).toFixed(2);
  const defTest = ctx.defectos.filter((d) => /^(AT|MC)/.test(d.evidencia)).length;
  return `
<section>
<h1>11. Métricas de calidad</h1>
<h2>11.1 Indicadores (KPI) definidos e interpretados</h2>
${tabla(['KPI', 'Definición', 'Valor', 'Interpretación'], [
  ['Casos ejecutados', 'Manuales + automatizados', `${r.totalCasos}`, 'Se ejecutó el 100 % de los casos diseñados.'],
  ['Casos aprobados / fallidos', 'Estado final de cada caso', `${r.totalAprob} aprobados (${pct(r.totalAprob, r.totalCasos)}) · ${r.totalFall} fallidos (${pct(r.totalFall, r.totalCasos)})`, 'Los fallidos no son ruido: cada uno se sustenta en un defecto (DEF-001 a DEF-008). Un porcentaje de fallo alto es esperable porque varios casos se diseñaron para sondear riesgos de seguridad.'],
  ['Cobertura de requisitos', 'Requisitos con al menos un caso / total', '10 de 10 (100 %)', 'RF-01 a RF-05 y RNF-01 a RNF-05 tienen casos asociados (matriz 6.4).'],
  ['Cobertura de código (servidor)', 'Sentencias cubiertas por la suite unitaria propia del proyecto (nyc)', ctx.cobertura.texto, 'Cobertura moderada: más de la mitad del código del servidor no se ejercita con pruebas unitarias. Nuestras pruebas de caja negra no miden cobertura de código. Dos pruebas unitarias del reto jwtForgedChallenge fallan en nuestro ambiente; no se investigaron (el repositorio no trae lockfile, por lo que <code>npm install</code> pudo instalar dependencias más nuevas que las del proyecto: es una hipótesis sin verificar).'],
  ['Cobertura según SonarQube', 'Coverage global importado (solo servidor)', `${s.coverage} %`, 'Es menor que la cobertura del servidor porque el denominador incluye el frontend, cuyas pruebas no se ejecutaron en este trabajo.'],
  ['Tasa de defectos', 'Defectos detectados por pruebas / casos ejecutados', `${defTest} / ${r.totalCasos} = ${(defTest / r.totalCasos).toFixed(2)}`, 'Aproximadamente 1 defecto distinto por cada 4–5 casos ejecutados; los 13 casos fallidos se agrupan en 8 defectos porque varios comparten causa.'],
  ['Densidad de defectos', 'Defectos totales / KLOC analizadas', `${ctx.defectos.length} / ${kloc} KLOC = ${(ctx.defectos.length / Number(kloc)).toFixed(2)} por KLOC`, 'Baja en términos absolutos porque los defectos se agrupan por causa. Por incidencias de SonarQube (bugs + vulnerabilidades) la densidad es ' + ((Number(s.bugs) + Number(s.vulnerabilities)) / Number(kloc)).toFixed(2) + ' por KLOC.'],
  ['Tiempo de ejecución', 'Duración de cada tipo de prueba', `Automatizadas: ${r.autSeg} s · Unitarias del servidor: ${ctx.cobertura.duracionSeg} s · Carga k6: ${ctx.k6.durSeg} s · SonarQube: ≈3 min`, 'La suite automatizada es lo bastante rápida para ejecutarse en cada <em>commit</em>.'],
  ['Densidad de defectos por severidad', 'Críticos / Altos / Medios / Bajos', `${ctx.defectos.filter((d) => d.severidad === 'Crítico').length} / ${ctx.defectos.filter((d) => d.severidad === 'Alto').length} / ${ctx.defectos.filter((d) => d.severidad === 'Medio').length} / ${ctx.defectos.filter((d) => d.severidad === 'Bajo').length}`, 'La mayor concentración está en severidad Alta, en seguridad.'],
])}
<h2>11.2 Resultados de SonarQube</h2>
${tabla(['Métrica', 'Valor', 'Lectura'], [
  ['Bugs', s.bugs, `Rating clásico de fiabilidad ${L(s.reliability_rating)}. 34 son promesas sin manejar y ${ctx.sonarBugsWeb} son de accesibilidad web. El dashboard de SonarQube 26.x usa un modelo nuevo ("software quality") y muestra ${s.software_quality_reliability_issues} incidencias de fiabilidad con rating ${L(s.software_quality_reliability_rating)}, porque además de los bugs cuenta code smells con impacto en fiabilidad.`],
  ['Vulnerabilidades', s.vulnerabilities, 'Ver sección 10.2. 13 bloqueantes y 7 críticas.'],
  ['Code smells', s.code_smells, 'Deuda técnica estimada: ' + ctx.deudaTxt + '.'],
  ['Duplicación', `${s.duplicated_lines_density} %`, 'Muy baja (umbral habitual 3 %): buen indicador de mantenibilidad.'],
  ['Coverage', `${s.coverage} %`, `Sobre 7,3 mil líneas a cubrir (cobertura de líneas ${s.line_coverage} %). Solo se importó la cobertura de las pruebas unitarias del servidor (${ctx.cobertura.texto}); el frontend no tiene cobertura medida.`],
  ['Maintainability Rating', L(s.sqale_rating), 'Deuda técnica pequeña en proporción al tamaño del código.'],
  ['Security Rating', L(s.security_rating), 'Calificación más baja posible: existe al menos una vulnerabilidad bloqueante.'],
  ['Reliability Rating', `${L(s.reliability_rating)} (clásico) / ${L(s.software_quality_reliability_rating)} (dashboard)`, 'C en el modelo clásico por bugs de severidad mayor; D en el modelo nuevo que muestra el dashboard. Ambos indican fiabilidad mejorable.'],
  ['Security Hotspots', s.security_hotspots, 'Sin hotspots pendientes de revisión.'],
  ['Líneas de código (ncloc)', s.ncloc, 'Tamaño analizado.'],
  ['Quality Gate', s.alert_status === 'OK' ? 'Aprobado (OK)' : s.alert_status, 'La compuerta por defecto evalúa solo el código nuevo (desde el 15/11/2026) y no hay incidencias nuevas, por lo que pasa aunque el rating de seguridad del código total sea E. Para un control real hay que definir una compuerta sobre el código total.'],
])}
<div class="galeria">
${fig(path.join(EVID, 'sonarqube', '01_resumen.png'), 'Figura. Dashboard de SonarQube: resumen del proyecto.', '100%')}
${fig(path.join(EVID, 'sonarqube', '03_bugs.png'), 'Figura. SonarQube: lista de bugs.', '49%')}
${fig(path.join(EVID, 'sonarqube', '04_code_smells.png'), 'Figura. SonarQube: lista de code smells.', '49%')}
</div>
<h2>11.3 Interpretación técnica</h2>
<ul>
  <li><strong>Mantenibilidad buena, seguridad deficiente.</strong> El código está bien estructurado (rating ${L(s.sqale_rating)}, ${s.duplicated_lines_density} % de duplicación) pero concentra riesgos de seguridad (rating ${L(s.security_rating)}); esa asimetría es coherente con un proyecto diseñado para ser vulnerable.</li>
  <li><strong>La calidad que mide la herramienta no es la calidad que perciben los usuarios.</strong> El sistema "funciona" (13 de 16 casos manuales aprobados) y a la vez es inseguro; por eso se necesitan pruebas dirigidas además de métricas de código.</li>
  <li><strong>La cobertura de pruebas es el indicador más débil:</strong> ${ctx.cobertura.texto}. Subirla requiere ejecutar también las pruebas del frontend y de API que el proyecto ya trae.</li>
  <li><strong>La densidad de defectos depende de la definición.</strong> Contada por causa raíz es baja (${(ctx.defectos.length / Number(kloc)).toFixed(2)}/KLOC); contada por incidencias de la herramienta es mayor. Se reportan ambas para no ocultar información.</li>
</ul>
</section>`;
}

export function seccion12(ctx) {
  return `
<section>
<h1>12. Reflexión y lecciones aprendidas</h1>
<h2>12.1 Valor del aseguramiento de calidad en el proyecto</h2>
<p>El aseguramiento de calidad convirtió la impresión "la tienda funciona" en hechos medibles: los flujos principales funcionan y rinden bien (p95 de ${ctx.k6.p95} ms), pero ${ctx.defectos.filter((d) => ['Crítico', 'Alto'].includes(d.severidad)).length} defectos de severidad crítica o alta ponen en riesgo a los usuarios. Ninguno de los de seguridad se habría visto probando únicamente la interfaz: aparecieron al llamar la API directamente, al inyectar entradas maliciosas y al analizar el código.</p>
<h2>12.2 Problemas encontrados</h2>
<ul>
  <li>El patrón sistémico de <strong>validación solo en el cliente</strong> (DEF-001, 002, 005, 006).</li>
  <li><strong>Inyección SQL, XSS y control de acceso roto</strong> sobre flujos centrales (DEF-003, 004, 008).</li>
  <li>34 promesas sin manejar y problemas de accesibilidad que afectan a la fiabilidad y a la usabilidad.</li>
</ul>
<h2>12.3 Retos técnicos y dificultades de automatización</h2>
<p>Estas dificultades ocurrieron realmente durante el trabajo y se resolvieron así:</p>
${tabla(['Dificultad', 'Causa', 'Resolución'], [
  ['Playwright 1.49 se colgaba sin mensaje, incluso con <code>--list</code> y un test trivial', 'Incompatibilidad con Node 24 (se aisló con un proyecto mínimo en ruta corta)', 'Actualizar a Playwright 1.65.1 y reinstalar Chromium.'],
  ['<code>package.json</code> con BOM tras escribirlo con PowerShell', 'Codificación UTF-8 con BOM', 'Reescribirlo sin BOM.'],
  ['Falsos positivos: AT-11 y AT-12 "pasaban"', 'Reutilizaban correos de un sondeo previo; el 400 era por duplicado, no por formato', 'Datos únicos por ejecución y revisión de la causa de cada resultado.'],
  ['MC-10 fallaba aunque la búsqueda funcionaba', 'Selector CSS equivocado en el script (la captura mostraba 3 productos)', 'Inspeccionar el DOM real y corregir el selector. Un fallo no siempre es un defecto del sistema.'],
  ['El primer parche de DEF-001 impedía arrancar el sistema', 'Los datos de ejemplo tienen contraseñas fuera de 5–40', 'Mover la validación del modelo a la ruta HTTP de registro y repetir la regresión.'],
  ['El clon de Git falló en Windows', 'Rutas de más de 260 caracteres', 'Activar <code>core.longpaths</code>.'],
  ['Caída del motor Docker y de WSL (se perdieron la corrida de ZAP y la de cobertura en curso)', 'Memoria agotada al correr SonarQube, ZAP y pruebas unitarias a la vez (quedaba 1 GB libre de 15 GB). Al reiniciar, el cierre forzado dejó archivos de socket obsoletos que Docker no podía borrar al arrancar', 'Renombrar las carpetas con los sockets obsoletos, reiniciar Docker/WSL, repetir las corridas perdidas y ejecutar las herramientas pesadas en secuencia.'],
  ['<code>npm ci</code> falló en la cobertura; tres pruebas unitarias fallaban', 'El repositorio no trae <code>package-lock.json</code>; y se había excluido <code>frontend/</code> al copiarlo', 'Usar <code>npm install</code> e incluir <code>frontend/</code>.'],
  ['Puertos 3000 y 9000 ocupados', 'Otros servicios de la máquina', 'Usar los puertos 3100 y 9100 y registrarlo en el informe.'],
])}
<h2>12.4 Aprendizajes obtenidos</h2>
<ul>
  <li>Definir el <strong>resultado esperado desde el requisito</strong> es lo que permite distinguir un defecto de una prueba mal escrita.</li>
  <li><strong>Verificar siempre por qué pasó o falló</strong> una prueba: dos casos aprobaban por una razón equivocada.</li>
  <li>Combinar técnicas: la partición de equivalencia y los valores límite encontraron defectos de validación; el análisis estático explicó la causa de los de XSS; la carga mostró que el rendimiento no es el problema.</li>
  <li>Una corrección sin <strong>prueba de regresión</strong> puede romper el sistema (el primer parche de DEF-001).</li>
</ul>
<h2>12.5 Trabajo en equipo</h2>
<p>El trabajo se organizó en cuatro frentes con dependencias entre sí: plan y diseño de casos, ambiente y automatización, seguridad (SonarQube y ZAP) y rendimiento y métricas. La principal lección de coordinación es que los frentes comparten el mismo ambiente y la misma versión del sistema: acordar puertos, datos de prueba y versiones de herramientas desde el inicio evitó resultados distintos entre integrantes. El reparto de roles propuesto está en el cronograma (5.9).</p>
<h2>12.6 Recomendaciones de mejora para futuros proyectos</h2>
<ol>
  <li>Elegir el sistema y levantarlo en la primera semana, y fijar versiones de las herramientas.</li>
  <li>Definir la validación en el servidor como requisito explícito y probarla siempre por API, además de la interfaz.</li>
  <li>Integrar las pruebas, SonarQube y ZAP en un pipeline con <em>quality gate</em> desde el inicio.</li>
  <li>Medir cobertura de código desde las pruebas unitarias y fijar una meta (por ejemplo 70 %).</li>
  <li>Registrar los defectos en una herramienta compartida (GitHub Issues o Jira) con ciclo de vida completo.</li>
  <li>Ejecutar las herramientas pesadas de forma secuencial o en una máquina con más memoria.</li>
</ol>
<h2>12.7 Limitaciones del trabajo</h2>
<ul>
  <li>Juice Shop es vulnerable a propósito: las cifras de defectos de seguridad no son representativas de un sistema comercial.</li>
  <li>Las pruebas se hicieron en un único navegador (Chromium) y un único ambiente local.</li>
  <li>El escaneo activo de ZAP tuvo tope de tiempo; no se ejecutó análisis de dependencias; no se cubrieron pago, pedidos ni administración.</li>
  <li>La prueba de carga corrió en la misma máquina que el sistema y no busca el punto de saturación.</li>
  <li>El parche de DEF-001/002 solo se aplicó a una instancia de prueba, no al repositorio.</li>
</ul>
</section>`;
}

export function seccion13(ctx) {
  const leer = (rel, max = 1800) => {
    const t = leerTxt(path.join(RAIZ, rel));
    return t.length > max ? t.slice(0, max) + '\n…' : t;
  };
  return `
<section>
<h1>13. Anexos</h1>
<h2>13.1 Enlaces</h2>
<ul>
  <li>Repositorio del sistema bajo prueba: <a href="${REPO}">${REPO}</a> (commit analizado <code>266448a</code>, 08/11/2026).</li>
  <li>Imagen Docker utilizada: <a href="https://hub.docker.com/r/bkimminich/juice-shop">hub.docker.com/r/bkimminich/juice-shop</a>.</li>
  <li>Guía oficial del proyecto: <a href="https://pwning.owasp-juice.shop">pwning.owasp-juice.shop</a>.</li>
  <li>Pipeline CI/CD del proyecto: <a href="${REPO}/blob/master/.github/workflows/ci.yml">.github/workflows/ci.yml</a>.</li>
</ul>
<p class="nota">Los scripts, configuraciones y reportes propios de este trabajo están en la carpeta del entregable (<code>pruebas/</code> y <code>evidencias/</code>). Antes de la entrega, el grupo debe publicarlos en un repositorio propio y reemplazar esta nota por su enlace.</p>
<h2>13.2 Estructura de los entregables</h2>
<pre class="codigo">${esc(`Final Aseguramiento de la calidad/
├── pruebas/
│   ├── playwright.config.js          configuración de Playwright
│   ├── tests/*.spec.js               21 casos automatizados (AT-01…AT-21)
│   ├── manual/ejecutar-manuales.mjs  procedimiento guiado de MC-01…MC-16
│   ├── rendimiento/carga-busqueda.js prueba de carga k6
│   ├── cobertura/run-coverage.sh     cobertura de las pruebas unitarias
│   ├── correcciones/                 generador del parche DEF-001/002
│   ├── ci/qa.yml                     workflow de CI propuesto
│   └── sonar-project.properties      configuración de SonarQube
├── evidencias/
│   ├── manuales/                     capturas y resultados-manuales.json
│   ├── automatizadas/                reporte HTML y resultados.json
│   ├── automatizadas-regresion-fix/  regresión con la corrección
│   ├── sonarqube/                    capturas y medidas exportadas
│   ├── zap/                          informes HTML/JSON/MD de OWASP ZAP
│   ├── cobertura/                    lcov y log de pruebas unitarias
│   └── registro-defectos.csv         registro de defectos
└── informe/                          generador del informe (este PDF)`)}</pre>
<h2>13.3 Archivos de configuración</h2>
<h3>sonar-project.properties</h3>
<pre class="codigo">${esc(leer('pruebas/sonar-project.properties'))}</pre>
<h3>playwright.config.js</h3>
<pre class="codigo">${esc(leer('pruebas/playwright.config.js', 1600))}</pre>
<h3>k6: carga-busqueda.js</h3>
<pre class="codigo">${esc(leer('pruebas/rendimiento/carga-busqueda.js', 1700))}</pre>
<h3>Workflow de CI propuesto: ci/qa.yml</h3>
<pre class="codigo">${esc(leer('pruebas/ci/qa.yml', 2600))}</pre>
<h2>13.4 Reportes exportados</h2>
<ul>
  <li><code>evidencias/automatizadas/reporte-html/index.html</code> y <code>resultados.json</code> (línea base de Playwright).</li>
  <li><code>evidencias/automatizadas-regresion-fix/</code> (regresión con corrección).</li>
  <li><code>evidencias/manuales/resultados-manuales.json</code> (16 casos con resultado esperado y obtenido).</li>
  <li><code>evidencias/sonarqube-measures.json</code> y <code>sonarqube-issues.json</code>; capturas en <code>evidencias/sonarqube/</code>.</li>
  <li><code>evidencias/zap/zap-informe.html</code>, <code>.json</code>, <code>.md</code>.</li>
  <li><code>evidencias/cobertura/</code> (log de pruebas unitarias y <code>lcov.info</code>).</li>
  <li><code>evidencias/k6-ejecucion.log</code> y <code>pruebas/rendimiento/resumen-k6.json</code>.</li>
  <li><code>evidencias/registro-defectos.csv</code>.</li>
</ul>
<h2>13.5 Recursos de apoyo</h2>
<ul>
  <li>OWASP Top 10 (2021): <a href="https://owasp.org/Top10/">owasp.org/Top10</a></li>
  <li>Playwright: <a href="https://playwright.dev/docs/intro">playwright.dev/docs/intro</a></li>
  <li>k6: <a href="https://grafana.com/docs/k6/latest/">grafana.com/docs/k6</a></li>
  <li>SonarQube: <a href="https://docs.sonarsource.com/sonarqube-server/">docs.sonarsource.com/sonarqube-server</a></li>
  <li>OWASP ZAP: <a href="https://www.zaproxy.org/docs/">zaproxy.org/docs</a></li>
  <li>IEEE 829-2008 (documentación de pruebas de software) e ISO/IEC/IEEE 29119 (pruebas de software).</li>
</ul>
</section>`;
}
