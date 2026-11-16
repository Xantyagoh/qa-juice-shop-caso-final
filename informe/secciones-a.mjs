// Secciones 1 a 5 del informe: portada, introducción, contexto, requisitos y plan de pruebas.
import { esc, tabla } from './lib.mjs';

export const INTEGRANTES = [
  'Santiago Betancur Rendón',
  'Diego Andrés Alzate Martínez',
  'Heyner Mena Capaña',
  'Carlos David Méndez Aristizábal',
];
export const FECHA = '15 de noviembre de 2026';
export const REPO = 'https://github.com/juice-shop/juice-shop';

export const REQ_FUNCIONALES = [
  ['RF-01', 'Registro de usuarios', 'El sistema permite registrar usuarios con correo de formato válido y único, contraseña de 5 a 40 caracteres, confirmación idéntica y pregunta de seguridad.', 'Con datos válidos se crea la cuenta y se redirige al login; con datos inválidos se rechaza (en la interfaz y también en el servidor).'],
  ['RF-02', 'Inicio de sesión', 'El sistema autentica a usuarios registrados y rechaza credenciales inválidas.', 'Credenciales válidas abren sesión y muestran el correo en el menú de cuenta; las inválidas muestran "Invalid email or password" sin abrir sesión.'],
  ['RF-03', 'Búsqueda de productos', 'El sistema permite buscar productos por texto.', 'Se listan solo productos que coinciden con el texto; si no hay coincidencias se informa "No results found".'],
  ['RF-04', 'Carrito de compras', 'Un usuario autenticado puede agregar productos a su carrito y solo él puede consultarlo.', 'El producto agregado aparece con su cantidad y el contador del carrito se actualiza; otro usuario no puede leer ese carrito.'],
  ['RF-05', 'Envío de feedback', 'El sistema permite enviar comentarios (máx. 160 caracteres) con calificación de 1 a 5 y CAPTCHA.', 'Se acepta un comentario de hasta 160 caracteres con calificación y CAPTCHA válidos; se rechazan comentarios más largos, calificaciones fuera de rango o CAPTCHA inválido.'],
];
export const REQ_NO_FUNCIONALES = [
  ['RNF-01', 'Rendimiento', 'Con 20 usuarios concurrentes durante 80 s, el 95 % de las búsquedas responde en menos de 1 s y ninguna supera 3 s.', 'p(95) < 1000 ms y máximo < 3000 ms (k6).'],
  ['RNF-02', 'Seguridad', 'El sistema debe resistir las vulnerabilidades más comunes (OWASP Top 10 2021): validación en el servidor, control de acceso, ausencia de inyección y cabeceras de seguridad.', 'Cero hallazgos de severidad alta sin mitigar; SonarQube Security Rating A–B.'],
  ['RNF-03', 'Usabilidad', 'Los formularios validan los datos de inmediato y muestran mensajes de error comprensibles; los campos son accesibles.', 'Mensaje claro por cada regla incumplida; campos con etiqueta asociada (SonarQube Web:InputWithoutLabelCheck = 0).'],
  ['RNF-04', 'Fiabilidad', 'Bajo carga normal el sistema no genera errores HTTP ni caídas.', 'Tasa de errores HTTP < 1 % durante la prueba de carga.'],
  ['RNF-05', 'Mantenibilidad', 'El código debe ser mantenible: baja deuda técnica y poca duplicación.', 'Maintainability Rating A–B y duplicación < 3 % (SonarQube).'],
];

export function seccion1y2() {
  return `
<section class="portada">
  <div class="logo-linea">INGENIERÍA DE SISTEMAS</div>
  <h2>ASEGURAMIENTO DE LA CALIDAD</h2>
  <h1>Caso práctico final</h1>
  <p class="subtitulo">Planificación, diseño, ejecución y documentación de actividades de aseguramiento de la calidad sobre un sistema de software real: <strong>OWASP Juice Shop</strong></p>
  <table class="portada-tabla">
    <tr><th>Asignatura</th><td>Aseguramiento de la calidad</td></tr>
    <tr><th>Trabajo</th><td>Caso práctico final (20 %)</td></tr>
    <tr><th>Integrantes</th><td>${INTEGRANTES.map(esc).join('<br>')}</td></tr>
    <tr><th>Fecha</th><td>${FECHA}</td></tr>
    <tr><th>Sistema bajo prueba</th><td>OWASP Juice Shop 20.4.0-SNAPSHOT (imagen Docker <code>bkimminich/juice-shop:latest</code>)</td></tr>
    <tr><th>Repositorio del sistema</th><td><a href="${REPO}">${REPO}</a></td></tr>
  </table>
</section>

<section>
<h1>2. Introducción</h1>
<h2>2.1 Presentación del proyecto de software</h2>
<p><strong>OWASP Juice Shop</strong> es una tienda web de jugos y productos relacionados, de código abierto, mantenida por la comunidad OWASP. Es una aplicación completa de comercio electrónico: permite registrarse, iniciar sesión, buscar productos, llenar un carrito, dejar comentarios y comprar. Está construida con Node.js/TypeScript en el servidor y Angular en el cliente, y se distribuye como imagen Docker.</p>
<h2>2.2 Objetivo general</h2>
<p>Aplicar de manera práctica e integrada los conocimientos del curso mediante la planificación, el diseño, la ejecución y la documentación de actividades de aseguramiento de la calidad sobre Juice Shop: pruebas funcionales y no funcionales, automatización, gestión de defectos, seguridad (análisis estático con SonarQube y dinámico con OWASP ZAP), métricas de calidad y análisis crítico de resultados.</p>
<h2>2.3 Justificación de la elección del sistema</h2>
<ul>
  <li><strong>Sistema real y funcional:</strong> no es una maqueta; tiene frontend, API REST, base de datos y un código de más de 32 000 líneas analizadas por SonarQube.</li>
  <li><strong>Reproducible:</strong> se levanta con un solo comando de Docker, lo que permite que cualquier integrante o el docente repita las pruebas sobre la misma versión.</li>
  <li><strong>Código abierto y verificable:</strong> el repositorio es público (<a href="${REPO}">${REPO}</a>), por lo que SonarQube puede analizar el código fuente real y todas las evidencias son comprobables.</li>
  <li><strong>Cubre todos los tipos de prueba pedidos:</strong> tiene formularios con reglas de validación (partición de equivalencia y valores límite), API REST (automatización), búsqueda (rendimiento) y superficie de seguridad (OWASP Top 10).</li>
  <li><strong>Suite de pruebas propia:</strong> incluye pruebas unitarias del servidor, que se ejecutaron para medir cobertura real de código.</li>
</ul>
<p class="nota"><strong>Aclaración de transparencia.</strong> Juice Shop contiene vulnerabilidades <em>intencionales</em>, pues es una herramienta de entrenamiento en seguridad. En este trabajo se tratan como defectos porque incumplen los requisitos de calidad definidos en la sección 4 (por ejemplo, RNF-02 de seguridad), y se documentan con la misma disciplina que en un sistema de producción. Esto explica que la tasa de defectos de seguridad sea alta y no debe leerse como representativa de un sistema comercial típico.</p>
</section>`;
}

const ARQ_SVG = `
<svg viewBox="0 0 760 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Arquitectura cliente-servidor de Juice Shop" style="width:100%;max-width:760px">
  <defs><marker id="f" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#475569"/></marker></defs>
  <rect x="10" y="60" width="150" height="110" rx="8" fill="#e0f2fe" stroke="#0284c7"/>
  <text x="85" y="88" text-anchor="middle" font-size="13" font-weight="700" fill="#075985">Navegador</text>
  <text x="85" y="108" text-anchor="middle" font-size="11" fill="#0c4a6e">SPA Angular</text>
  <text x="85" y="124" text-anchor="middle" font-size="11" fill="#0c4a6e">TypeScript</text>
  <text x="85" y="140" text-anchor="middle" font-size="11" fill="#0c4a6e">Angular Material</text>
  <rect x="250" y="30" width="260" height="170" rx="8" fill="#fef3c7" stroke="#d97706"/>
  <text x="380" y="55" text-anchor="middle" font-size="13" font-weight="700" fill="#92400e">Servidor monolítico (Docker)</text>
  <text x="380" y="78" text-anchor="middle" font-size="11" fill="#78350f">Node.js + Express (TypeScript)</text>
  <rect x="270" y="90" width="105" height="40" rx="5" fill="#fff" stroke="#d97706"/><text x="322" y="114" text-anchor="middle" font-size="11" fill="#78350f">API REST /api</text>
  <rect x="385" y="90" width="105" height="40" rx="5" fill="#fff" stroke="#d97706"/><text x="437" y="114" text-anchor="middle" font-size="11" fill="#78350f">/rest · estáticos</text>
  <rect x="270" y="142" width="220" height="40" rx="5" fill="#fff" stroke="#d97706"/><text x="380" y="166" text-anchor="middle" font-size="11" fill="#78350f">Sequelize (ORM) · middlewares</text>
  <rect x="600" y="40" width="150" height="70" rx="8" fill="#dcfce7" stroke="#16a34a"/>
  <text x="675" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="#166534">SQLite</text>
  <text x="675" y="88" text-anchor="middle" font-size="11" fill="#14532d">usuarios, productos, carritos</text>
  <rect x="600" y="130" width="150" height="70" rx="8" fill="#dcfce7" stroke="#16a34a"/>
  <text x="675" y="158" text-anchor="middle" font-size="12" font-weight="700" fill="#166534">MarsDB (NoSQL)</text>
  <text x="675" y="178" text-anchor="middle" font-size="11" fill="#14532d">reseñas, pedidos</text>
  <line x1="160" y1="115" x2="248" y2="115" stroke="#475569" stroke-width="1.5" marker-end="url(#f)"/>
  <line x1="248" y1="128" x2="162" y2="128" stroke="#475569" stroke-width="1.5" marker-end="url(#f)"/>
  <text x="204" y="108" text-anchor="middle" font-size="10" fill="#475569">HTTP/JSON</text>
  <line x1="510" y1="100" x2="598" y2="80" stroke="#475569" stroke-width="1.5" marker-end="url(#f)"/>
  <line x1="510" y1="140" x2="598" y2="160" stroke="#475569" stroke-width="1.5" marker-end="url(#f)"/>
  <text x="380" y="232" text-anchor="middle" font-size="11" fill="#475569">Ambiente de pruebas: Docker Desktop (WSL2) en Windows 11 · puerto 3100</text>
</svg>`;

export function seccion3() {
  return `
<section>
<h1>3. Contexto del proyecto</h1>
<h2>3.1 Funcionalidad general y problema que resuelve</h2>
<p>Juice Shop simula una tienda en línea completa: catálogo de productos, búsqueda, registro e inicio de sesión de clientes, carrito de compras, pedidos, reseñas, comentarios de clientes con CAPTCHA, panel de administración y más de cien retos de seguridad. Resuelve dos problemas: (1) ofrece una aplicación web realista sobre la cual practicar pruebas y (2) sirve como objetivo seguro y legal para entrenar la detección de vulnerabilidades del OWASP Top 10.</p>
<h2>3.2 Tipo de arquitectura</h2>
<p><strong>Cliente-servidor con servidor monolítico.</strong> Un cliente de página única (SPA en Angular) se comunica por HTTP/JSON con un único servidor Node.js/Express que contiene la API REST, la lógica de negocio y el acceso a datos. No hay microservicios ni arquitectura orientada a eventos.</p>
<div class="centrado">${ARQ_SVG}<p class="pie">Figura 1. Arquitectura de Juice Shop y ambiente de pruebas.</p></div>
<h2>3.3 Tecnologías utilizadas</h2>
${tabla(['Capa', 'Tecnología'], [
  ['Frontend', 'Angular, TypeScript, Angular Material (SPA)'],
  ['Backend', 'Node.js (≥ 22) y Express, escrito en TypeScript'],
  ['Base de datos', 'SQLite (relacional, vía Sequelize) y MarsDB (NoSQL en memoria) para reseñas y pedidos'],
  ['Frameworks / librerías', 'Sequelize (ORM), Angular Material, finale-rest (API automática sobre los modelos)'],
  ['Infraestructura', 'Imagen Docker <code>bkimminich/juice-shop</code>; ejecución local en Docker Desktop 29.4.0 (WSL2) sobre Windows 11'],
  ['Herramientas de QA usadas', 'Playwright 1.65.1 (Node 24.14.1), k6, SonarQube Community 26.11, OWASP ZAP 2.17, nyc (cobertura)'],
])}
<h2>3.4 Alcance funcional cubierto por las pruebas</h2>
<ul>
  <li><strong>Cubierto:</strong> registro de usuarios (RF-01), inicio de sesión (RF-02), búsqueda de productos (RF-03), carrito (RF-04), feedback (RF-05), y atributos no funcionales de rendimiento, seguridad, usabilidad, fiabilidad y mantenibilidad.</li>
  <li><strong>No cubierto (fuera de alcance):</strong> pago y entrega de pedidos, billetera, subida de archivos, chatbot, panel de administración y los retos de seguridad propios del juego. Se excluyen para concentrar el esfuerzo en los flujos centrales de una tienda.</li>
</ul>
</section>`;
}

export function seccion4(ctx) {
  const s = ctx.sonar;
  return `
<section>
<h1>4. Requerimientos y criterios de calidad</h1>
<h2>4.1 Requisitos funcionales relevantes</h2>
<p>Los requisitos se formularon a partir del comportamiento esperado de una tienda en línea y de las reglas visibles en la propia interfaz (por ejemplo, contraseña de 5 a 40 caracteres y comentario de máximo 160).</p>
${tabla(['ID', 'Nombre', 'Requisito', 'Criterio de aceptación'], REQ_FUNCIONALES.map((r) => [`<strong>${r[0]}</strong>`, r[1], r[2], r[3]]))}
<h2>4.2 Requisitos no funcionales relevantes</h2>
${tabla(['ID', 'Atributo', 'Requisito', 'Criterio de aceptación'], REQ_NO_FUNCIONALES.map((r) => [`<strong>${r[0]}</strong>`, r[1], r[2], r[3]]))}
<h2>4.3 Criterios de aceptación</h2>
<p>Una funcionalidad se considera <strong>aceptada</strong> cuando (a) todos sus casos de prueba asociados terminan en estado <em>Aprobado</em> con el resultado obtenido igual al esperado, (b) no quedan defectos abiertos de severidad Crítica o Alta asociados a ella y (c) se cuenta con evidencia (captura, log o reporte) de la ejecución. El resultado esperado de cada caso se define a partir del requisito, nunca a partir del comportamiento observado del sistema.</p>
<h2>4.4 Atributos de calidad analizados</h2>
${tabla(['Atributo', 'Cómo se analizó', 'Hallazgo principal'], [
  ['Funcionalidad', 'Casos manuales MC-01 a MC-13 y automatizados AT-01 a AT-05, AT-07, AT-08, AT-13, AT-14, AT-16', 'Los flujos felices funcionan; las reglas de validación se cumplen en la interfaz.'],
  ['Usabilidad', 'MC-02, MC-06, MC-07, MC-09 (mensajes de error) y reglas de accesibilidad de SonarQube', `Mensajes claros y validación inmediata; SonarQube reporta ${ctx.sonarBugsWeb} bugs de accesibilidad (campos sin etiqueta y tablas sin encabezados).`],
  ['Fiabilidad', 'Prueba de carga k6 (RNF-04) y bugs de SonarQube', `Sin errores bajo carga (${ctx.k6.fallos}); SonarQube detecta ${s.bugs} bugs, 34 de ellos promesas sin manejar (S9383).`],
  ['Rendimiento', 'AT-05 y prueba de carga k6 con 20 usuarios (RNF-01)', `p(95) = ${ctx.k6.p95} ms frente a un umbral de 1000 ms: cumple con amplio margen.`],
  ['Seguridad', 'AT-15, AT-19 a AT-21, MC-14 a MC-16, SonarQube y OWASP ZAP', `Múltiples fallas: inyección SQL, XSS, control de acceso roto y validación solo en cliente. Security Rating ${ctx.ratingLetra(s.security_rating)}.`],
  ['Mantenibilidad', 'SonarQube (deuda técnica, duplicación, code smells)', `Maintainability Rating ${ctx.ratingLetra(s.sqale_rating)}, duplicación ${s.duplicated_lines_density} %, ${s.code_smells} code smells.`],
])}
</section>`;
}

export function seccion5() {
  return `
<section>
<h1>5. Plan de pruebas</h1>
<p>El plan sigue la estructura del estándar <strong>IEEE 829-2008</strong> (plan de pruebas de software) y los lineamientos del proceso de pruebas de <strong>ISO/IEC/IEEE 29119-2/-3</strong>.</p>
<h2>5.1 Identificación y objetivos</h2>
<ul>
  <li><strong>Identificador:</strong> PP-JS-2026-01 · versión 1.0 · 15/11/2026.</li>
  <li><strong>Objetivo general de la prueba:</strong> evaluar si Juice Shop 20.4.0-SNAPSHOT cumple los requisitos RF-01 a RF-05 y RNF-01 a RNF-05 de la sección 4.</li>
  <li><strong>Objetivos específicos:</strong> (1) verificar los flujos funcionales centrales; (2) comprobar las reglas de validación con partición de equivalencia y valores límite en interfaz y servidor; (3) medir tiempo de respuesta y estabilidad bajo carga; (4) identificar vulnerabilidades con análisis estático y dinámico; (5) obtener métricas de calidad y cobertura; (6) registrar y dar seguimiento a los defectos.</li>
</ul>
<h2>5.2 Alcance</h2>
<p><strong>Dentro del alcance:</strong> registro, login, búsqueda, carrito, feedback, API REST asociada, código fuente del repositorio y superficie web expuesta en <code>http://localhost:3100</code>. <strong>Fuera del alcance:</strong> pago, pedidos, panel de administración, retos del juego, pruebas en navegadores distintos de Chromium, pruebas en dispositivos móviles reales.</p>
<h2>5.3 Ítems de prueba</h2>
<p>Imagen <code>bkimminich/juice-shop:latest</code> (versión de la aplicación 20.4.0-SNAPSHOT, verificada en <code>/rest/admin/application-version</code>) y código fuente clonado del repositorio oficial en el commit <code>266448a</code> (08/11/2026).</p>
<h2>5.4 Tipos y niveles de prueba</h2>
${tabla(['Nivel', 'Qué se prueba', 'Cómo se ejecutó en este trabajo'], [
  ['Unitarias', 'Funciones y módulos del servidor', 'Suite unitaria propia del proyecto (<code>npm run test:server:coverage</code>, Node test runner + nyc), ejecutada en contenedor para medir cobertura real.'],
  ['Integración', 'Interacción cliente–API–base de datos', 'Pruebas automatizadas de API con Playwright (AT-03 a AT-21): registro, carrito, feedback, seguridad.'],
  ['Sistema', 'Flujos completos desde la interfaz', 'Casos manuales MC-01 a MC-16 en Chromium y automatizados de UI (AT-01, AT-02).'],
  ['Aceptación', 'Cumplimiento de los criterios de aceptación', 'Evaluación de cada caso contra el criterio de la sección 4.3 y resumen de métricas.'],
])}
<h2>5.5 Estrategias</h2>
${tabla(['Estrategia', 'Aplicación'], [
  ['Funcionales', 'Verificación de RF-01 a RF-05 con casos de caja negra derivados de los requisitos.'],
  ['No funcionales', 'Rendimiento y fiabilidad (k6), seguridad (SonarQube, ZAP, casos OWASP), usabilidad (mensajes y accesibilidad), mantenibilidad (SonarQube).'],
  ['Exploratorias', 'Sondeo previo de la API con valores límite y entradas anómalas (por ejemplo contraseñas de 0, 1, 4, 41 y 100 caracteres), cuyo resultado motivó los casos AT-06 a AT-12 y MC-14.'],
  ['Automatizadas', 'Suite Playwright de 21 casos repetible en una línea de comandos; k6 para carga; contenedores para SonarQube y ZAP.'],
])}
<h2>5.6 Técnicas de diseño aplicadas</h2>
<ul>
  <li><strong>Partición de equivalencia:</strong> clases válida e inválidas de correo (sin @, sin parte local, dominio sin punto, duplicado), contraseña, credenciales y búsqueda (con y sin resultados).</li>
  <li><strong>Valores límite:</strong> contraseña en 4, 5, 40 y 41 caracteres; comentario en 160 y 161; calificación en 0.</li>
  <li><strong>Pruebas basadas en riesgo / OWASP Top 10:</strong> inyección SQL, XSS, control de acceso, configuración de seguridad.</li>
  <li><strong>Tabla de decisión</strong> (login): combinaciones de correo y contraseña válidos/inválidos que determinan el resultado esperado (ver sección 6.3).</li>
</ul>
<h2>5.7 Criterios de aprobación y suspensión</h2>
<ul>
  <li><strong>Aprobación de un caso:</strong> el resultado obtenido coincide con el esperado derivado del requisito.</li>
  <li><strong>Criterio de salida:</strong> todos los casos ejecutados, evidencias archivadas, defectos registrados y clasificados, informe de métricas generado.</li>
  <li><strong>Suspensión:</strong> el sistema no responde o el ambiente se corrompe; <strong>reanudación:</strong> reinicio del contenedor y verificación de <code>/rest/admin/application-version</code>.</li>
</ul>
<h2>5.8 Recursos</h2>
${tabla(['Tipo', 'Detalle'], [
  ['Humanos', INTEGRANTES.map(esc).join(', ') + ' (roles en el cronograma).'],
  ['Herramientas', 'Playwright 1.65.1; k6 (imagen <code>grafana/k6</code>); SonarQube Community 26.11 + sonar-scanner-cli; OWASP ZAP 2.17 (<code>zaproxy/zap-stable</code>); nyc; Docker 29.4.0; Git 2.53; Node 24.14.1; Chromium 159 (headless).'],
  ['Ambientes', 'Equipo local Windows 11 Pro, 15 GB de RAM, Docker Desktop con WSL2. Sistema bajo prueba en <code>localhost:3100</code>; SonarQube en <code>localhost:9100</code>. Ambiente aislado y desechable (contenedores).'],
])}
<h2>5.9 Cronograma</h2>
${tabla(['#', 'Actividad', 'Responsable (propuesto)', 'Fecha', 'Estado'], [
  ['1', 'Selección del sistema y plan de pruebas', 'Santiago Betancur', '15/11/2026', 'Completada'],
  ['2', 'Preparación del ambiente (Docker, Juice Shop, SonarQube)', 'Diego Alzate', '15/11/2026', 'Completada'],
  ['3', 'Diseño de casos (EP, BVA, tabla de decisión)', 'Santiago Betancur', '15/11/2026', 'Completada'],
  ['4', 'Ejecución de casos manuales y capturas', 'Heyner Mena', '15/11/2026', 'Completada'],
  ['5', 'Automatización (Playwright) y regresión', 'Diego Alzate', '15/11/2026', 'Completada'],
  ['6', 'Prueba de carga (k6)', 'Carlos Méndez', '15/11/2026', 'Completada'],
  ['7', 'Análisis estático (SonarQube) y cobertura', 'Heyner Mena', '15/11/2026', 'Completada'],
  ['8', 'Análisis dinámico (OWASP ZAP)', 'Heyner Mena', '15/11/2026', 'Completada'],
  ['9', 'Gestión de defectos, corrección y verificación', 'Santiago Betancur', '15/11/2026', 'Completada'],
  ['10', 'Métricas, reflexión e informe', 'Carlos Méndez', '15–16/11/2026', 'Completada'],
  ['11', 'Revisión del equipo y repetición manual de casos críticos', 'Todos', '16–20/11/2026', 'Pendiente'],
  ['12', 'Entrega en Microsoft Teams (PDF)', 'Todos', '22/11/2026 11:59 PM', 'Pendiente'],
])}
<h2>5.10 Riesgos del plan</h2>
${tabla(['Riesgo', 'Impacto', 'Mitigación'], [
  ['Recursos de máquina insuficientes (varios contenedores a la vez)', 'Caída del motor Docker, pérdida de corridas', 'Ejecutar herramientas pesadas en secuencia; reiniciar Docker/WSL y repetir. Ocurrió durante este trabajo (ver sección 12).'],
  ['Falsos positivos por datos de prueba reutilizados', 'Casos que "pasan" por la razón equivocada', 'Datos únicos por ejecución y revisión del motivo del resultado. Ocurrió con AT-11 y AT-12 (ver sección 12).'],
  ['Vulnerabilidades intencionales del sistema elegido', 'Sesgo en la tasa de defectos', 'Declarado explícitamente en la sección 2.3 y en las limitaciones.'],
  ['Incompatibilidad entre versiones de herramientas', 'Pruebas que no arrancan', 'Fijar versiones (Playwright 1.65.1 con Node 24).'],
])}
<h2>5.11 Entregables</h2>
<p>Este informe en PDF; scripts de prueba (<code>pruebas/</code>); reportes exportados (<code>evidencias/</code>); registro de defectos; configuración de herramientas (anexos, sección 13).</p>
</section>`;
}
