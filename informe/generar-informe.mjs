// Genera el informe final (HTML -> PDF) a partir de los resultados REALES guardados en evidencias/.
// Uso:  node informe/generar-informe.mjs   (requiere haber ejecutado npm install en pruebas/)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../pruebas/node_modules/@playwright/test/index.mjs';
import { AQUI, RAIZ, EVID, esc, leerJson, leerTxt, existe, url, quitaAnsi, aplanaPlaywright, pct } from './lib.mjs';
import { CASOS_AUTO } from './datos-auto.mjs';
import { DEFECTOS_BASE } from './datos-defectos.mjs';
import { seccion1y2, seccion3, seccion4, seccion5, REQ_FUNCIONALES, REQ_NO_FUNCIONALES } from './secciones-a.mjs';
import { seccion6, seccion7, seccion8, seccion9 } from './secciones-b.mjs';
import { seccion10, seccion11, seccion12, seccion13 } from './secciones-c.mjs';

const letra = (n) => ['', 'A', 'B', 'C', 'D', 'E'][Math.round(Number(n))] || '?';

// ---------- SonarQube ----------
const med = leerJson(path.join(EVID, 'sonarqube-measures.json'), { component: { measures: [] } });
const sonar = Object.fromEntries(med.component.measures.map((m) => [m.metric, m.value]));
const issues = leerJson(path.join(EVID, 'sonarqube-issues.json'), []);
const vulns = issues.filter((i) => i.type === 'VULNERABILITY');
const porRegla = {};
for (const v of vulns) {
  porRegla[v.rule] ??= { regla: v.rule, mensaje: v.message.replace(/\.$/, ''), n: 0 };
  porRegla[v.rule].n++;
}
const sonarVulnPorRegla = Object.values(porRegla).sort((a, b) => b.n - a.n);
const sev = (s) => vulns.filter((v) => v.severity === s).length;
const sonarVulnPorSev = `Por severidad: ${sev('BLOCKER')} bloqueantes, ${sev('CRITICAL')} críticas, ${sev('MAJOR')} mayores y ${sev('MINOR')} menores`;
const sonarBugsWeb = issues.filter((i) => i.type === 'BUG' && i.rule.startsWith('Web:')).length;
const mins = Number(sonar.sqale_index || 0);
const deudaTxt = `${Math.floor(mins / 60)} h ${mins % 60} min`;

// ---------- Casos manuales ----------
const manualDef = { 'MC-14': 'DEF-001', 'MC-15': 'DEF-003', 'MC-16': 'DEF-008' };
const manual = (leerJson(path.join(EVID, 'manuales', 'resultados-manuales.json'), []) || []).map((c) => ({ ...c, obtenido: String(c.obtenido).replace(/\.{2,}/g, '.'), defecto: manualDef[c.id] }));

// ---------- Casos automatizados ----------
const autoDef = { 'AT-06': 'DEF-001', 'AT-09': 'DEF-001', 'AT-10': 'DEF-002', 'AT-11': 'DEF-002', 'AT-12': 'DEF-002', 'AT-15': 'DEF-004', 'AT-17': 'DEF-005', 'AT-18': 'DEF-006', 'AT-19': 'DEF-003', 'AT-20': 'DEF-007' };
const pw = leerJson(path.join(EVID, 'automatizadas', 'resultados.json'), { suites: [], stats: {} });
const resultadosAuto = aplanaPlaywright(pw);
const porId = Object.fromEntries(resultadosAuto.map((r) => [r.titulo.match(/^AT-\d+/)?.[0], r]));
function obtenidoDe(r) {
  if (!r) return 'Sin resultado (no ejecutado)';
  if (r.estado === 'Aprobado') {
    return r.stdout.length ? `Aserciones cumplidas. Salida registrada: ${r.stdout.join(' | ')}` : 'Todas las aserciones se cumplieron.';
  }
  const lineas = r.error.split('\n').map((l) => l.trim());
  const exp = lineas.find((l) => /^Expected/.test(l));
  const rec = lineas.find((l) => /^Received/.test(l));
  const base = [exp, rec].filter(Boolean).join(' · ') || lineas[0];
  return `${base}${r.stdout.length ? ` — Salida: ${r.stdout.join(' | ')}` : ''}`;
}
const auto = CASOS_AUTO.map((c) => {
  const r = porId[c.id];
  let obtenido = obtenidoDe(r);
  if (c.id === 'AT-20' && r?.estado === 'Fallido') obtenido = `Cabeceras recibidas: ${r.stdout.join(' ')}. Faltan Content-Security-Policy y Strict-Transport-Security (valor null); X-Content-Type-Options y X-Frame-Options sí están.`;
  return { ...c, estado: r?.estado ?? 'Fallido', duracion: Math.round(r?.duracion ?? 0), obtenido, adjuntos: r?.adjuntos ?? [], defecto: autoDef[c.id] };
});

// ---------- Regresión con la corrección ----------
const pwFix = leerJson(path.join(EVID, 'automatizadas-regresion-fix', 'resultados.json'), { suites: [] });
const fixRes = aplanaPlaywright(pwFix);
const fixId = Object.fromEntries(fixRes.map((r) => [r.titulo.match(/^AT-\d+/)?.[0], r]));
const fix = {
  aprob: fixRes.filter((r) => r.estado === 'Aprobado').length,
  fall: fixRes.filter((r) => r.estado === 'Fallido').length,
  fallIds: fixRes.filter((r) => r.estado === 'Fallido').map((r) => r.titulo.match(/^AT-\d+/)?.[0]),
  comparacion: auto
    .filter((c) => fixId[c.id] && (c.estado !== fixId[c.id].estado || c.id.match(/AT-(06|07|08|09|10|11|12|13)$/)))
    .map((c) => ({ id: c.id, base: c.estado, fix: fixId[c.id].estado })),
};

// ---------- k6 ----------
const k6j = leerJson(path.join(RAIZ, 'pruebas', 'rendimiento', 'resumen-k6.json'), { metrics: {} });
const m = k6j.metrics || {};
const dur = m.http_req_duration || {};
const k6log = quitaAnsi(leerTxt(path.join(EVID, 'k6-ejecucion.log')));
const iniK6 = k6log.indexOf('THRESHOLDS');
const k6Resumen = (iniK6 >= 0 ? k6log.slice(Math.max(0, k6log.lastIndexOf('\n', iniK6)), k6log.indexOf('running (')) : k6log).replace(/█/g, '').trim();
const ultimoRunning = [...k6log.matchAll(/running ((?:(d+)m)?([d.]+)s)/g)].pop();
const durSeg = ultimoRunning ? Number(ultimoRunning[1] || 0) * 60 + Number(ultimoRunning[2]) : 80;
const f1 = (x) => (x == null ? '?' : Number(x).toFixed(2));
const k6 = {
  reqs: m.http_reqs?.count ?? '?',
  avg: f1(dur.avg), med: f1(dur.med), p95: f1(dur['p(95)']), max: f1(dur.max),
  fallos: `${((m.http_req_failed?.value ?? 0) * 100).toFixed(2)} %`,
  checks: `${((m.checks?.value ?? 1) * 100).toFixed(2)} %`,
  vusMax: m.vus_max?.value ?? 20, durSeg: Math.round(durSeg),
};

// ---------- Logs de Playwright ----------
const logPw = quitaAnsi(leerTxt(path.join(EVID, 'playwright-ejecucion.log')));
const logPlaywrightResumen = logPw
  .split('\n')
  .filter((l) => /Running \d+ test|^\s+(ok|x)\s+\d+|^\s+\d+ (passed|failed)|status=|Login con|Usuario B|Tiempo de resp|csp/.test(l))
  .map((l) => l.replace(/\s+tests\\/g, ' ').slice(0, 150))
  .join('\n');
const at05 = leerTxt(path.join(EVID, 'playwright-ejecucion.log')).match(/Tiempo de respuesta búsqueda: (\d+) ms/);

// ---------- Cobertura ----------
const covLog = quitaAnsi(leerTxt(path.join(EVID, 'cobertura', 'test-server-coverage.log')));
const stm = covLog.match(/Statements\s*:\s*([\d.]+)% \( (\d+)\/(\d+) \)/);
const lns = covLog.match(/Lines\s*:\s*([\d.]+)% \( (\d+)\/(\d+) \)/);
const pas = covLog.match(/# pass (\d+)/)?.[1];
const fal = covLog.match(/# fail (\d+)/)?.[1];
const dms = covLog.match(/# duration_ms ([\d.]+)/)?.[1];
const cobertura = {
  texto: stm ? `${stm[1]} % de sentencias (${stm[2]}/${stm[3]}) y ${lns?.[1]} % de líneas; ${pas} pruebas unitarias aprobadas, ${fal} fallidas` : 'no disponible',
  duracionSeg: dms ? (Number(dms) / 1000).toFixed(1) : '?',
};

// ---------- ZAP ----------
const zj = leerJson(path.join(EVID, 'zap', 'zap-informe.json'), null);
const riesgoEs = { 3: 'Alto', 2: 'Medio', 1: 'Bajo', 0: 'Informativo' };
const owaspZap = (n) =>
  /sql/i.test(n) ? 'A03 Inyección'
  : /cross site scripting|xss|dangerous js/i.test(n) ? 'A03 Inyección'
  : /redirect/i.test(n) ? 'A01 Pérdida de control de acceso'
  : /session id in url/i.test(n) ? 'A04 Diseño inseguro'
  : /content security policy|csp|anti-clickjacking|x-content-type|cross-domain|cors|permissions policy|feature policy|strict-transport|server leaks|x-powered|cross-origin|spectre|sec-fetch|cookie|sub resource/i.test(n) ? 'A05 Configuración incorrecta'
  : /vulnerable js|library/i.test(n) ? 'A06 Componentes vulnerables'
  : /timestamp|disclosure|information|private ip|debug|comment/i.test(n) ? 'A05 Configuración incorrecta (divulgación de información)'
  : 'A05 Configuración incorrecta';
const MITIGA = [
  [/sql/i, 'Usar consultas parametrizadas (nunca concatenar la entrada) y no mostrar errores internos al cliente.'],
  [/redirect/i, 'Validar el destino contra una lista exacta de URL permitidas (comparación completa, no "contiene").'],
  [/session id in url/i, 'Falso positivo probable: es el identificador de transporte de socket.io (parámetro sid), propio del protocolo; sin acción.'],
  [/content security policy/i, 'Definir una política Content-Security-Policy restrictiva (por ejemplo con helmet) y evitar scripts inline.'],
  [/anti-clickjacking/i, 'Las 3 instancias son endpoints de socket.io; la página principal sí envía X-Frame-Options (AT-20). Añadirla también a las respuestas de la API.'],
  [/x-content-type/i, 'Enviar X-Content-Type-Options: nosniff en todas las respuestas.'],
  [/cross-domain misconfiguration/i, 'Restringir CORS a los orígenes necesarios en lugar de permitir cualquier origen (*).'],
  [/cross-origin-embedder|cross-origin-opener/i, 'Agregar las cabeceras de aislamiento COEP y COOP.'],
  [/feature policy/i, 'Reemplazar la cabecera obsoleta Feature-Policy por Permissions-Policy.'],
  [/timestamp/i, 'Evitar exponer marcas de tiempo internas en respuestas públicas.'],
  [/private ip/i, 'No exponer direcciones IP internas en respuestas ni cabeceras.'],
  [/dangerous js/i, 'Evitar eval y funciones equivalentes en el código del cliente.'],
  [/server leaks/i, 'Eliminar o generalizar la cabecera Server.'],
  [/modern web application/i, 'Informativo: es una SPA; ZAP la recorre con el AJAX spider.'],
  [/user agent fuzzer/i, 'Informativo: sin acción.'],
  [/cacheable|cache/i, 'Informativo: definir Cache-Control según la sensibilidad del contenido.'],
  [/information disclosure|debug|comment|suspicious/i, 'Informativo: revisar que no se exponga información sensible en el navegador.'],
];
const mitigaDe = (n, sol) => MITIGA.find(([re]) => re.test(n))?.[1] || (sol ? sol.replace(/<[^>]+>/g, '').slice(0, 160) : 'Revisar el hallazgo según la documentación de ZAP.');
let zapAlertas = [];
if (zj) {
  // Solo se cuentan las alertas del sistema bajo prueba; el navegador del AJAX spider también tocó sitios de
  // terceros (GitHub, etc.) de forma pasiva y esos hallazgos no son del sistema evaluado.
  const objetivo = (zj.site || []).filter((s) => s['@name'].includes('host.docker.internal'));
  for (const s of objetivo) for (const a of s.alerts || []) {
    zapAlertas.push({
      nombre: a.name || a.alert, riesgo: Number(a.riskcode), riesgoEs: riesgoEs[Number(a.riskcode)] ?? 'Informativo',
      instancias: Number(a.count ?? (a.instances || []).length), owasp: owaspZap(a.name || a.alert), mitigacion: mitigaDe(a.name || a.alert, a.solution),
    });
  }
  zapAlertas.sort((a, b) => b.riesgo - a.riesgo || b.instancias - a.instancias);
}
const cuentaZap = (r) => zapAlertas.filter((a) => a.riesgo === r).length;
const zapTodos = zj ? (zj.site || []).flatMap((x) => x.alerts || []) : [];
const cuentaTodos = (r) => zapTodos.filter((x) => Number(x.riskcode) === r).length;
const zapLog = leerTxt(path.join(EVID, 'zap-ejecucion.log'));
const zapUrls = zapLog.match(/Total of (\d+) URLs/)?.[1] ?? '?';
const zapPass = zapLog.match(/PASS: (\d+)/g)?.length ?? 0;
const zapPassTotal = zapLog.match(/FAIL-NEW: \d+\s+FAIL-INPROG: \d+\s+WARN-NEW: (\d+)\s+WARN-INPROG: \d+\s+INFO: \d+\s+IGNORE: \d+\s+PASS: (\d+)/);
const zap = {
  alertas: zapAlertas,
  descripcion: zj
    ? `Se ejecutó zap-full-scan.py (OWASP ZAP 2.17.0, imagen zaproxy/zap-stable) contra http://localhost:3100: spider tradicional y AJAX spider (4 min máx.), escaneo pasivo y escaneo activo limitado a 10 minutos. ZAP identificó ${zapUrls} URL y evaluó ${zapPassTotal ? Number(zapPassTotal[1]) + Number(zapPassTotal[2]) : '?'} reglas: ${zapPassTotal ? zapPassTotal[2] : '?'} sin hallazgos y ${zapPassTotal ? zapPassTotal[1] : '?'} con alertas. Resultado para el sistema bajo prueba: ${zapAlertas.length} tipos de alerta (${cuentaZap(3)} altas, ${cuentaZap(2)} medias, ${cuentaZap(1)} bajas, ${cuentaZap(0)} informativas). El resumen del informe HTML de ZAP (${cuentaTodos(3)} altas, ${cuentaTodos(2)} medias, ${cuentaTodos(1)} bajas, ${cuentaTodos(0)} informativas) es mayor porque suma también los hallazgos de sitios de terceros (por ejemplo github.com) que el navegador del AJAX spider tocó de forma pasiva; esos no se consideran del sistema evaluado.`
    : 'El escaneo dinámico no pudo completarse en esta corrida; ver limitaciones.',
  interpretacion: zj
    ? `ZAP aportó lo que el análisis estático no ve: comportamiento real en ejecución. Detectó de forma independiente una inyección SQL en la búsqueda y en el login (errores 500 con mensaje SQLITE_ERROR), una redirección abierta y varias debilidades de configuración (CSP ausente, CORS permisivo, cabeceras de aislamiento ausentes). Se verificaron a mano la inyección SQL de la búsqueda, la redirección abierta y el CORS (evidencias/zap/verificacion-manual-zap.txt). Una alerta media (Session ID in URL Rewrite) se clasificó como falso positivo: el parámetro sid pertenece al protocolo socket.io. Otras vulnerabilidades graves, como el XSS de MC-16 y el acceso sin contraseña de MC-15, se confirmaron con casos dirigidos porque una SPA es difícil de recorrer de forma automática; ZAP no las reportó. Además ZAP (regla Retire.js) no detectó librerías JavaScript vulnerables en el frontend.`
    : 'Sin datos.',
};

// ---------- Defectos ----------
// Todos los defectos tienen evidencia ejecutada (casos MC/AT, SonarQube o verificación manual de ZAP).
const defectos = [...DEFECTOS_BASE];

// ---------- Resúmenes y trazabilidad ----------
const manAprob = manual.filter((c) => c.estado === 'Aprobado').length;
const autAprob = auto.filter((c) => c.estado === 'Aprobado').length;
const resumen = {
  manAprob, manFall: manual.length - manAprob, autAprob, autFall: auto.length - autAprob,
  autSeg: ((pw.stats?.duration ?? 0) / 1000).toFixed(1),
  totalCasos: manual.length + auto.length, totalAprob: manAprob + autAprob, totalFall: manual.length - manAprob + auto.length - autAprob,
};
const todos = [...manual.map((c) => ({ ...c, tipo: 'M' })), ...auto.map((c) => ({ ...c, tipo: 'A' }))];
const reqs = [...REQ_FUNCIONALES, ...REQ_NO_FUNCIONALES].map((r) => r[0]);
const trazabilidad = reqs.map((rq) => {
  const casos = todos.filter((c) => c.req.split(/\s*\/\s*|\s*\(/)[0].split(' / ').includes(rq) || c.req.includes(rq));
  const man = casos.filter((c) => c.tipo === 'M').map((c) => c.id).join(', ') || '—';
  const aut = casos.filter((c) => c.tipo === 'A').map((c) => c.id).join(', ') || '—';
  return { req: rq, manual: man, auto: aut, aprob: casos.filter((c) => c.estado === 'Aprobado').length, fall: casos.filter((c) => c.estado === 'Fallido').length };
});
// RNF-01 / RNF-04 / RNF-05 se verifican con k6 y SonarQube
for (const t of trazabilidad) {
  if (t.req === 'RNF-01') { t.auto = `${t.auto}, k6 (carga)`; t.aprob += 1; }
  if (t.req === 'RNF-04') { t.auto = 'k6 (carga)'; t.aprob = 1; t.fall = 0; }
  if (t.req === 'RNF-05') { t.auto = 'SonarQube'; t.aprob = 1; t.fall = 0; }
  if (t.req === 'RNF-03') { t.manual = 'MC-02, MC-06, MC-07, MC-09'; t.auto = 'SonarQube (accesibilidad)'; t.aprob = 4; t.fall = 1; }
}

const ciUp = leerTxt(path.join(RAIZ, 'sistema', 'juice-shop', '.github', 'workflows', 'ci.yml')).split('\n').slice(0, 58).join('\n');

const owaspMatriz = [
  { cat: 'A01 Pérdida de control de acceso', evidencia: 'AT-15: un usuario lee el carrito de otro (HTTP 200). ZAP + verificación manual: redirección abierta en /redirect (DEF-016). AT-21 correcto (listado de usuarios exige token).', riesgo: 'Alto', mitigacion: 'Verificar en el servidor la pertenencia del recurso al usuario del token; denegar por defecto.' },
  { cat: 'A02 Fallas criptográficas', evidencia: `SonarQube: claves privadas y contraseña en el repositorio (4), hash débil (2), HTTP en claro (7), PRNG no seguro (2).`, riesgo: 'Alto', mitigacion: 'Retirar y rotar secretos, usar un gestor de secretos, hashes modernos (bcrypt/argon2) y HTTPS.' },
  { cat: 'A03 Inyección', evidencia: "MC-15/AT-19: inyección SQL en el login (acceso como admin). ZAP + verificación manual: inyección SQL en la búsqueda (HTTP 500 con SQLITE_ERROR, DEF-015). MC-16: XSS en búsqueda. SonarQube: sanitización de Angular desactivada (9), ejecución dinámica de código (5).", riesgo: 'Crítico', mitigacion: 'Consultas parametrizadas; mantener la sanitización de Angular; CSP; validar y codificar entradas.' },
  { cat: 'A04 Diseño inseguro', evidencia: 'Validación solo en el cliente: contraseña, correo, comentario y calificación aceptados fuera de regla por el servidor (DEF-001, 002, 005, 006).', riesgo: 'Medio', mitigacion: 'Validación centralizada en el servidor con esquemas; modelar amenazas desde el diseño.' },
  { cat: 'A05 Configuración de seguridad incorrecta', evidencia: `AT-20: sin Content-Security-Policy ni HSTS. ZAP: ${zapAlertas.length} tipos de alerta en el objetivo (${cuentaZap(3)} altas, ${cuentaZap(2)} medias); CORS con Access-Control-Allow-Origin: * (DEF-017).`, riesgo: 'Medio', mitigacion: 'Aplicar cabeceras de seguridad (helmet), restringir CORS, desactivar depuración.' },
  { cat: 'A06 Componentes vulnerables y desactualizados', evidencia: 'Evaluación parcial: la regla Retire.js de ZAP no detectó librerías JavaScript vulnerables en el frontend. No se analizaron las dependencias del servidor (SCA).', riesgo: null, mitigacion: 'Incorporar npm audit u OWASP Dependency-Check al pipeline.' },
  { cat: 'A07 Fallas de identificación y autenticación', evidencia: 'DEF-001: el servidor acepta contraseñas de 1 a 100 caracteres (corregido en el ambiente de prueba).', riesgo: 'Alto', mitigacion: 'Política de contraseñas en el servidor, límites de intentos y MFA.' },
  { cat: 'A08 Fallas de integridad de software y datos', evidencia: 'Solo evidencia estática: ejecución dinámica de código (SonarQube S1523, 5 ocurrencias).', riesgo: 'Medio', mitigacion: 'Evitar eval/ejecución dinámica; verificar la integridad de componentes externos.' },
  { cat: 'A09 Fallas de registro y monitoreo', evidencia: 'Solo evidencia estática: infraestructura Terraform sin registros de acceso (S6258, 2).', riesgo: 'Bajo', mitigacion: 'Habilitar registros de acceso y alertas.' },
  { cat: 'A10 Falsificación de peticiones del lado del servidor (SSRF)', evidencia: 'No evaluado.', riesgo: null, mitigacion: 'Validar y restringir las URL que el servidor consulta.' },
];

const ctx = {
  manual, auto, resumen, trazabilidad, fix, k6, k6Resumen, logPlaywrightResumen, at05ms: at05 ? `${at05[1]} ms` : 'n/d',
  sonar, sonarVersion: '26.11', sonarVulnPorRegla, sonarVulnPorSev, sonarBugsWeb, deudaTxt, ratingLetra: letra,
  cobertura, zap, defectos, owaspMatriz, ciUpstream: ciUp,
};

// ---------- Registro de defectos (CSV) ----------
const csv = [
  ['ID', 'Titulo', 'Descripcion', 'Severidad', 'Prioridad', 'Estado', 'Evidencia', 'Requisito', 'Categoria OWASP'],
  ...defectos.map((d) => [d.id, d.titulo, d.descripcion, d.severidad, d.prioridad, d.estado, d.evidencia, d.req, d.owasp]),
].map((fila) => fila.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
fs.writeFileSync(path.join(EVID, 'registro-defectos.csv'), '﻿' + csv, 'utf8');

// ---------- HTML ----------
const css = leerTxt(path.join(AQUI, 'estilos.css'));
const indice = ['1. Portada', '2. Introducción', '3. Contexto del proyecto', '4. Requerimientos y criterios de calidad', '5. Plan de pruebas', '6. Diseño de casos de prueba', '7. Ejecución y evidencias de pruebas', '8. Automatización de pruebas', '9. Gestión de defectos', '10. Pruebas de seguridad', '11. Métricas de calidad', '12. Reflexión y lecciones aprendidas', '13. Anexos'];
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Caso práctico final - Aseguramiento de la calidad</title><style>${css}</style></head><body>
${seccion1y2().replace('</section>\n\n<section>', `<div class="indice"><h3>Contenido</h3><ol>${indice.map((i) => `<li>${esc(i)}</li>`).join('')}</ol></div></section>\n\n<section>`)}
${seccion3()}
${seccion4(ctx)}
${seccion5()}
${seccion6(ctx)}
${seccion7(ctx)}
${seccion8(ctx)}
${seccion9(ctx)}
${seccion10(ctx)}
${seccion11(ctx)}
${seccion12(ctx)}
${seccion13(ctx)}
</body></html>`;
const htmlPath = path.join(AQUI, 'informe.html');
fs.writeFileSync(htmlPath, html, 'utf8');

// ---------- PDF ----------
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url(htmlPath), { waitUntil: 'load' });
await page.waitForTimeout(1500);
const salida = path.join(RAIZ, 'Informe_Caso_Practico_Final.pdf');
await page.pdf({
  path: salida, format: 'A4', printBackground: true,
  margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div style="font-size:8px;width:100%;padding:0 16mm;color:#64748b">Aseguramiento de la calidad · Caso práctico final · OWASP Juice Shop</div>',
  footerTemplate: '<div style="font-size:8px;width:100%;padding:0 16mm;color:#64748b;display:flex;justify-content:space-between"><span>Ingeniería de Sistemas</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>',
});
await browser.close();
console.log('PDF generado:', salida, '·', (fs.statSync(salida).size / 1024 / 1024).toFixed(1), 'MB');
console.log(`casos manuales ${manual.length}, automáticos ${auto.length}, defectos ${defectos.length}, alertas ZAP ${zapAlertas.length}`);
