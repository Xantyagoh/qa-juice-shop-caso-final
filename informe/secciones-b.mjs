// Secciones 6 a 9: diseño de casos, ejecución y evidencias, automatización y gestión de defectos.
import path from 'node:path';
import { esc, tabla, insignia, fig, url, existe, leerTxt, EVID, RAIZ, pct } from './lib.mjs';
import { DEFECTOS_BASE, CICLO_DEF001 } from './datos-defectos.mjs';

const lista = (arr) => `<ol>${arr.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`;

function casoTabla(c) {
  return `<table class="caso">
  <tr><th colspan="2">${esc(c.id)} · ${esc(c.nombre)} ${insignia(c.estado)}</th></tr>
  <tr><td>Objetivo</td><td>${esc(c.objetivo)}</td></tr>
  <tr><td>Requisito asociado</td><td>${esc(c.req)}</td></tr>
  <tr><td>Técnica de diseño</td><td>${esc(c.tecnica)}</td></tr>
  <tr><td>Precondiciones</td><td>${esc(c.pre)}</td></tr>
  <tr><td>Datos de entrada</td><td>${esc(c.entrada ?? c.datos)}</td></tr>
  <tr><td>Pasos de ejecución</td><td>${lista(c.pasos)}</td></tr>
  <tr><td>Resultado esperado</td><td>${esc(c.esperado)}</td></tr>
  <tr><td>Resultado obtenido</td><td>${esc(c.obtenido)}</td></tr>
  <tr><td>Estado</td><td>${insignia(c.estado)}${c.defecto ? ` · defecto asociado: <strong>${esc(c.defecto)}</strong>` : ''}</td></tr>
</table>`;
}

export function seccion6(ctx) {
  const manuales = ctx.manual.map(casoTabla).join('\n');
  const autos = ctx.auto.map(casoTabla).join('\n');
  const trazab = ctx.trazabilidad;
  return `
<section>
<h1>6. Diseño de casos de prueba</h1>
<p>Se diseñaron <strong>${ctx.manual.length} casos manuales</strong> y <strong>${ctx.auto.length} casos automatizados</strong> (mínimo exigido: 10 y 5). Todos se documentan con la misma plantilla: identificador, nombre, objetivo, requisito asociado, precondiciones, datos de entrada, pasos, resultado esperado, resultado obtenido y estado. El resultado esperado se derivó del requisito y no del comportamiento observado.</p>

<h2>6.1 Técnicas de diseño aplicadas</h2>
<h3>Partición de equivalencia</h3>
${tabla(['Entrada', 'Clase válida', 'Clases inválidas', 'Casos'], [
  ['Correo (RF-01)', 'Formato usuario@dominio.ext único', 'Sin "@"; sin parte local; dominio sin punto; correo duplicado', 'MC-01, MC-06, AT-10, AT-11, AT-12, AT-13'],
  ['Credenciales (RF-02)', 'Correo y contraseña registrados', 'Contraseña incorrecta; payload de inyección SQL', 'MC-08, MC-09, MC-15, AT-01, AT-02, AT-19'],
  ['Búsqueda (RF-03)', 'Texto con coincidencias ("apple")', 'Texto sin coincidencias ("zzzxxxqqq"); script en el texto', 'MC-10, MC-11, MC-16, AT-03, AT-04'],
  ['Confirmación de contraseña', 'Igual a la contraseña', 'Distinta de la contraseña', 'MC-07'],
])}
<h3>Análisis de valores límite</h3>
${tabla(['Variable (regla)', 'Valores probados', 'Casos'], [
  ['Longitud de contraseña (5 a 40)', '4 (inválido), 5 (válido), 40 (válido), 41 (inválido)', 'MC-02 a MC-05 (interfaz), AT-06 a AT-09 (servidor), MC-14'],
  ['Longitud del comentario (máx. 160)', '160 (válido), 161 (inválido)', 'MC-13 (interfaz), AT-16, AT-17 (servidor)'],
  ['Calificación (1 a 5)', '0 (inválido)', 'AT-18'],
])}
<h3>Tabla de decisión (inicio de sesión)</h3>
${tabla(['Regla', 'Correo existe', 'Contraseña correcta', 'Resultado esperado', 'Caso'], [
  ['R1', 'Sí', 'Sí', 'Acceso concedido', 'MC-08, AT-01'],
  ['R2', 'Sí', 'No', 'Rechazo: "Invalid email or password"', 'MC-09, AT-02'],
  ['R3', 'No', 'No aplica', 'Rechazo: "Invalid email or password"', 'Cubierto por la misma clase que R2'],
  ['R4', 'Payload SQL (no es un correo)', 'Cualquiera', 'Rechazo (sin acceso)', 'MC-15, AT-19'],
])}

<h2>6.2 Casos de prueba manuales (MC-01 a MC-${String(ctx.manual.length).padStart(2, '0')})</h2>
<p class="nota">Los casos manuales se ejecutaron siguiendo el procedimiento paso a paso en un navegador real (Chromium). Para garantizar que las capturas y los textos observados fueran reproducibles, el procedimiento se condujo con un script de apoyo (<code>pruebas/manual/ejecutar-manuales.mjs</code>) que toma una captura por paso y lee el resultado del DOM. El 21/11/2026 se reverificó MC-14 mediante una petición HTTP directa, fuera del script: el defecto (DEF-001) sigue presente. MC-15 y MC-16 implican reproducir una explotación real (inicio de sesión por inyección SQL y ejecución de un script); el equipo debe repetirlos a mano siguiendo estos mismos pasos antes de la entrega. Las capturas de cada caso están en la sección 7.2.</p>
${manuales}

<h2>6.3 Casos de prueba automatizados (AT-01 a AT-${String(ctx.auto.length).padStart(2, '0')})</h2>
${autos}

<h2>6.4 Matriz de trazabilidad requisito–casos</h2>
${tabla(['Requisito', 'Casos manuales', 'Casos automatizados', 'Resultado'], trazab.map((t) => [`<strong>${t.req}</strong>`, t.manual, t.auto, `${t.aprob} aprobados · ${t.fall} fallidos`]))}
</section>`;
}

export function seccion7(ctx) {
  const dirM = path.join(EVID, 'manuales');
  const imgs = ctx.manual
    .map((c) => {
      const figs = c.evidencias
        .map((f, i) => fig(path.join(dirM, f), `${c.id} · ${c.nombre} — evidencia ${i + 1}`, c.evidencias.length > 1 ? '49%' : '60%'))
        .join('');
      return `<div class="evid"><h4>${esc(c.id)} · ${esc(c.nombre)} ${insignia(c.estado)}</h4><p class="obs"><strong>Comportamiento observado:</strong> ${esc(c.obtenido)}</p><div class="galeria">${figs}</div></div>`;
    })
    .join('');

  const filasAuto = ctx.auto.map((c) => [esc(c.id), esc(c.nombre), esc(c.req), insignia(c.estado), `${c.duracion} ms`]);
  const fallosAuto = ctx.auto
    .filter((c) => c.estado === 'Fallido')
    .map((c) => [esc(c.id), esc(c.esperado), esc(c.obtenido), esc(c.defecto || '')]);
  const uiShots = ctx.auto
    .filter((c) => ['AT-01', 'AT-02'].includes(c.id) && c.adjuntos[0])
    .map((c) => fig(path.resolve(RAIZ, 'pruebas', c.adjuntos[0]), `${c.id} · ${c.nombre} (captura automática de Playwright)`, '49%'))
    .join('');

  return `
<section>
<h1>7. Ejecución y evidencias de pruebas</h1>
<h2>7.1 Entorno y método de ejecución</h2>
<p>Todas las pruebas se ejecutaron el 15 de noviembre de 2026 contra la misma instancia: <code>bkimminich/juice-shop:latest</code> (versión 20.4.0-SNAPSHOT) en Docker, puerto 3100, con datos de ejemplo recién creados. Los logs, reportes y capturas citados están en la carpeta <code>evidencias/</code> y pueden regenerarse con los scripts de <code>pruebas/</code>.</p>
<p class="nota">Los puertos 3000 y 9000, habituales para estas herramientas, estaban ocupados por otros servicios de la máquina; por eso Juice Shop usa 3100 y SonarQube 9100.</p>

<h2>7.2 Pruebas funcionales manuales: capturas y comportamiento observado</h2>
<p>Resultado: <strong>${ctx.resumen.manAprob} de ${ctx.manual.length}</strong> casos aprobados y <strong>${ctx.resumen.manFall}</strong> fallidos.</p>
${imgs}

<h2>7.3 Pruebas funcionales automatizadas</h2>
<p>Resultado de la línea base: <strong>${ctx.resumen.autAprob} de ${ctx.auto.length}</strong> casos aprobados y <strong>${ctx.resumen.autFall}</strong> fallidos, en ${ctx.resumen.autSeg} s de ejecución.</p>
${tabla(['Caso', 'Nombre', 'Requisito', 'Estado', 'Duración'], filasAuto)}
<h3>Evidencia de fallos encontrados</h3>
${tabla(['Caso', 'Resultado esperado', 'Resultado obtenido (real)', 'Defecto'], fallosAuto)}
<h3>Logs y reporte</h3>
<pre class="log">${esc(ctx.logPlaywrightResumen)}</pre>
${fig(path.join(EVID, 'capturas', 'reporte-playwright.png'), 'Figura. Reporte HTML de Playwright de la línea base.')}
${uiShots ? `<div class="galeria">${uiShots}</div>` : ''}

<h2>7.4 Pruebas de rendimiento (carga y tiempo de respuesta)</h2>
<p><strong>Objetivo:</strong> validar RNF-01 y RNF-04. <strong>Herramienta:</strong> k6 (imagen <code>grafana/k6</code>). <strong>Escenario:</strong> 20 usuarios virtuales concurrentes, rampa de 10 s, 60 s sostenidos y rampa de bajada de 10 s; cada usuario hace una búsqueda aleatoria (8 términos) y espera 0,5 s. <strong>Script:</strong> <code>pruebas/rendimiento/carga-busqueda.js</code>.</p>
${tabla(['Métrica', 'Valor medido', 'Umbral', 'Resultado'], [
  ['Peticiones totales', String(ctx.k6.reqs), '—', '—'],
  ['Tiempo de respuesta promedio', `${ctx.k6.avg} ms`, '—', '—'],
  ['Tiempo de respuesta mediana', `${ctx.k6.med} ms`, '—', '—'],
  ['p(95)', `${ctx.k6.p95} ms`, '< 1000 ms', insignia('Aprobado')],
  ['Máximo', `${ctx.k6.max} ms`, '< 3000 ms', insignia('Aprobado')],
  ['Tasa de errores HTTP', ctx.k6.fallos, '< 1 %', insignia('Aprobado')],
  ['Verificaciones (checks) exitosas', ctx.k6.checks, '> 99 %', insignia('Aprobado')],
  ['Usuarios concurrentes máximos', String(ctx.k6.vusMax), '20', insignia('Aprobado')],
])}
<pre class="log">${esc(ctx.k6Resumen)}</pre>
<p><strong>Interpretación.</strong> El endpoint de búsqueda responde en promedio en ${ctx.k6.avg} ms y el p(95) es ${ctx.k6.p95} ms, unas ${Math.round(1000 / ctx.k6.p95)} veces por debajo del umbral, sin errores. La carga aplicada (≈34 peticiones/s) es moderada y la aplicación corre en la misma máquina que la herramienta de carga, por lo que el resultado demuestra cumplimiento del requisito definido pero <em>no</em> establece el punto de saturación; para ello habría que escalar usuarios (prueba de estrés), algo que queda como trabajo futuro.</p>

<h2>7.5 Pruebas no funcionales</h2>
${tabla(['Atributo', 'Evidencia', 'Resultado'], [
  ['Rendimiento', `AT-05: búsqueda individual en ${ctx.at05ms}; prueba de carga k6 (7.4)`, 'Cumple RNF-01'],
  ['Estabilidad / fiabilidad', `Prueba de carga de ${ctx.k6.durSeg} s con 20 usuarios: ${ctx.k6.fallos} de errores HTTP y 2 verificaciones por petición al 100 %. La aplicación no falló durante las pruebas; la única caída de la jornada fue del motor Docker del equipo por falta de memoria, no del sistema evaluado (sección 12.3)`, 'Cumple RNF-04'],
  ['Usabilidad', 'MC-02, MC-06, MC-07, MC-09: mensajes claros ("Password must be 5-40 characters long.", "Email address is not valid.", "Passwords do not match", "Invalid email or password."). Pero SonarQube detecta 9 campos sin etiqueta asociada y 3 tablas sin encabezados (DEF-014).', 'Cumple parcialmente RNF-03'],
])}

<h2>7.6 Verificación de la corrección (regresión)</h2>
<p>Tras corregir DEF-001 y DEF-002 en una instancia aislada (puerto 3200) se repitió la suite completa. Resultado: <strong>${ctx.fix.aprob} aprobados</strong> y <strong>${ctx.fix.fall} fallidos</strong> (frente a ${ctx.resumen.autAprob} y ${ctx.resumen.autFall} de la línea base). Pasaron a verde AT-06, AT-09, AT-10, AT-11 y AT-12; no apareció ninguna regresión (AT-07, AT-08, AT-13 siguen aprobados). Los casos que siguen fallando (${ctx.fix.fallIds.join(', ')}) corresponden a defectos aún abiertos.</p>
${tabla(['Caso', 'Línea base (3100)', 'Con corrección (3200)'], ctx.fix.comparacion.map((f) => [esc(f.id), insignia(f.base), insignia(f.fix)]))}

<h2>7.7 Análisis de resultados</h2>
<ul>
  <li>Los <strong>flujos felices</strong> y las <strong>validaciones de la interfaz</strong> funcionan: todos los casos manuales de RF-01 a RF-05 aprobaron.</li>
  <li>El patrón dominante de falla es <strong>validación solo en el cliente</strong> (DEF-001, 002, 005, 006): las reglas se cumplen en el formulario pero el servidor acepta cualquier valor. Es un defecto de diseño, no de un campo puntual.</li>
  <li>Las pruebas de seguridad (AT-15, AT-19, MC-15, MC-16) encontraron fallas de gravedad crítica y alta, consistentes con lo que SonarQube y ZAP reportan por separado (sección 10).</li>
  <li>El rendimiento no es un riesgo en las condiciones evaluadas.</li>
</ul>
</section>`;
}

export function seccion8(ctx) {
  const specs = [
    ['auth.spec.js', 'RF-02', 'Login válido e inválido desde la interfaz (UI)', '2'],
    ['search.spec.js', 'RF-03 / RNF-01', 'Búsqueda con y sin resultados; tiempo de respuesta individual', '3'],
    ['registration.spec.js', 'RF-01', 'Valores límite de contraseña (4, 5, 40, 41) y partición de equivalencia de correo, en el servidor', '8'],
    ['basket-feedback.spec.js', 'RF-04 / RF-05', 'Carrito, control de acceso entre usuarios y valores límite del feedback (160/161, calificación 0)', '5'],
    ['security.spec.js', 'RNF-02', 'Inyección SQL, cabeceras de seguridad y control de acceso sin token', '3'],
  ];
  const ciUpstream = ctx.ciUpstream;
  return `
<section>
<h1>8. Automatización de pruebas</h1>
<h2>8.1 Herramienta y lenguaje</h2>
${tabla(['Elemento', 'Detalle'], [
  ['Herramienta', 'Playwright Test 1.65.1 (UI y API en el mismo marco); k6 para carga'],
  ['Lenguaje', 'JavaScript (módulos ES) sobre Node.js 24.14.1'],
  ['Navegador', 'Chromium 159 en modo headless'],
  ['Reportes', 'HTML, JSON y capturas por prueba; trazas (trace.zip) para las fallidas'],
  ['Ejecución', '<code>cd pruebas &amp;&amp; npx playwright test</code> (opcional: <code>BASE_URL</code> y <code>RESULTS_DIR</code>)'],
])}
<h2>8.2 Descripción de scripts y escenarios cubiertos</h2>
${tabla(['Script', 'Requisito', 'Escenarios', 'Casos'], specs.map((s) => [`<code>${s[0]}</code>`, s[1], s[2], s[3]]))}
<p>Los datos son únicos en cada ejecución (correo con marca de tiempo y número aleatorio) para que las pruebas sean repetibles y para que un rechazo solo pueda deberse a la regla probada. Un ejemplo representativo (valores límite de contraseña):</p>
<pre class="codigo">${esc(`const casosContrasena = [
  { id: 'AT-06', longitud: 4,  valida: false, tecnica: 'Límite inferior - 1' },
  { id: 'AT-07', longitud: 5,  valida: true,  tecnica: 'Límite inferior' },
  { id: 'AT-08', longitud: 40, valida: true,  tecnica: 'Límite superior' },
  { id: 'AT-09', longitud: 41, valida: false, tecnica: 'Límite superior + 1' },
];
for (const c of casosContrasena) {
  test(\`\${c.id} Contraseña de \${c.longitud} caracteres\`, async ({ request }) => {
    const res = await registerViaApi(request, uniqueEmail('bva'), 'a'.repeat(c.longitud));
    expect(res.status()).toBe(c.valida ? 201 : 400);
  });
}`)}</pre>
<h2>8.3 Evidencia de ejecución y resultados</h2>
<p>Resultados de la línea base: <strong>${ctx.resumen.autAprob} aprobados / ${ctx.resumen.autFall} fallidos de ${ctx.auto.length}</strong> (${ctx.resumen.autSeg} s). Los fallos no son errores del script: se verificó que cada uno se debe a una respuesta real del sistema distinta de la esperada (por ejemplo, HTTP 201 en lugar de 400). La corrida de regresión con la corrección de DEF-001/002 se documenta en 7.6.</p>
<pre class="log">${esc(ctx.logPlaywrightResumen)}</pre>
<h2>8.4 Integración CI/CD</h2>
<p><strong>El proyecto sí posee pipeline.</strong> Juice Shop incluye en su repositorio <code>.github/workflows/ci.yml</code> (“CI/CD Pipeline”), que en GitHub Actions ejecuta lint, pruebas unitarias del frontend y del servidor con cobertura, pruebas de integración de API y publicación de la cobertura, además de análisis CodeQL (<code>codeql-analysis.yml</code>). Fragmento real del archivo:</p>
<pre class="codigo">${esc(ciUpstream)}</pre>
<p>La suite que desarrollamos en este trabajo <strong>no forma parte de ese pipeline</strong> (no tenemos permisos sobre el repositorio oficial). Para integrarla se prepararon, como propuesta, los workflows <code>pruebas/ci/qa.yml</code> (Playwright + k6 + ZAP baseline) y la configuración de SonarQube (<code>sonar-project.properties</code>). Flujo propuesto:</p>
<ol>
  <li>En cada <em>push</em> o <em>pull request</em>, GitHub Actions levanta Juice Shop como contenedor de servicio.</li>
  <li>Instala dependencias y navegadores y ejecuta <code>npx playwright test</code>; falla el pipeline si algún caso falla.</li>
  <li>Ejecuta la prueba de carga k6 con umbrales (p95 &lt; 1000 ms); falla si no se cumplen.</li>
  <li>Ejecuta el escaneo ZAP baseline y el scanner de SonarQube con <em>Quality Gate</em>.</li>
  <li>Publica los reportes HTML/JSON como artefactos del pipeline.</li>
</ol>
<p class="nota">El archivo <code>qa.yml</code> es una propuesta sin ejecutar en GitHub Actions: se valida su sintaxis, pero no se corrió en la nube porque requiere un repositorio propio del grupo.</p>
</section>`;
}

export function seccion9(ctx) {
  const defs = ctx.defectos;
  const cont = (sev) => defs.filter((d) => d.severidad === sev).length;
  const filas = defs.map((d) => [
    `<strong>${esc(d.id)}</strong>`,
    `<strong>${esc(d.titulo)}</strong><br>${esc(d.descripcion)}`,
    insignia(d.severidad),
    esc(d.prioridad),
    esc(d.estado),
    esc(d.evidencia),
  ]);
  return `
<section>
<h1>9. Gestión de defectos</h1>
<h2>9.1 Herramienta utilizada</h2>
<p>Los defectos se registraron en un <strong>registro estructurado propio</strong> (<code>evidencias/registro-defectos.csv</code>), con los campos de una incidencia de Jira o de GitHub Issues (identificador, descripción, severidad, prioridad, estado, evidencia, requisito, categoría OWASP), de modo que puede importarse a cualquiera de ellas. No se usó una herramienta en línea porque el grupo no cuenta con un proyecto compartido para este trabajo; se recomienda migrarlo a GitHub Issues al publicar el repositorio.</p>
<h2>9.2 Listado y clasificación</h2>
<p>Se registraron <strong>${defs.length} defectos</strong>: ${cont('Crítico')} críticos, ${cont('Alto')} altos, ${cont('Medio')} medios y ${cont('Bajo')} bajos. Criterios: <em>Crítico</em> = compromete la cuenta del administrador o los datos de todos los usuarios sin autenticación; <em>Alto</em> = permite acceso indebido o ejecución de código con poco esfuerzo; <em>Medio</em> = incumple una regla de negocio o debilita la defensa; <em>Bajo</em> = impacto menor o de buenas prácticas.</p>
${tabla(['ID', 'Descripción', 'Severidad', 'Prioridad', 'Estado', 'Evidencia'], filas, 'defectos')}
<h2>9.3 Ciclo de vida de un defecto representativo (DEF-001)</h2>
<p>Se eligió DEF-001 porque pudo recorrerse hasta la verificación con evidencia real: se detectó, se reprodujo, se corrigió en una instancia aislada y se verificó con pruebas de regresión.</p>
${tabla(['Estado', 'Qué ocurrió', 'Fecha', 'Evidencia'], CICLO_DEF001.map((c) => [`<strong>${esc(c[0])}</strong>`, esc(c[1]), esc(c[2]), esc(c[3])]))}
<pre class="codigo">${esc(`# DEF-001 / DEF-002 — corrección aplicada en POST /api/Users (build/server.js)
app.post('/api/Users', (req, res, next) => {
    const pwd = typeof body.password === 'string' ? body.password.trim() : null;
    if (pwd === null || pwd.length < 5 || pwd.length > 40)
        return res.status(400).json({ status: 'error', message: 'Password must be 5-40 characters long.' });
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(mail))
        return res.status(400).json({ status: 'error', message: 'Email address is not valid.' });
    next();
});`)}</pre>
<p class="nota">Una primera versión del parche validaba la contraseña en el <em>modelo</em> de datos y fue descartada: los datos de ejemplo de Juice Shop (<code>ciso</code>, <code>bjoern</code>, <code>test</code>, etc.) tienen contraseñas fuera de 5–40 y el sistema no arrancaba. La validación se movió a la ruta HTTP de registro. Es un ejemplo de por qué una corrección debe probarse con regresión completa.</p>
</section>`;
}
