// Ejecución guiada de los casos de prueba MANUALES (MC-01 a MC-16).
// Cada caso sigue su procedimiento paso a paso en un navegador real (Chromium) y toma capturas de pantalla
// de los pasos clave. El "resultado obtenido" se lee del DOM / de la respuesta real del sistema;
// el estado (Aprobado/Fallido) resulta de compararlo con el resultado esperado definido a partir del requisito.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../evidencias/manuales');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];
const uniq = () => `${Date.now()}${Math.floor(Math.random() * 1e4)}`;
const PASS = 'Passw0rd!';
let usuarioMC01 = null;

async function dismiss(page) {
  const w = page.locator('button[aria-label="Close Welcome Banner"]');
  if (await w.count()) await w.first().click().catch(() => {});
  const c = page.locator('a[aria-label="dismiss cookie message"]');
  if (await c.count()) await c.first().click().catch(() => {});
}
async function nuevaPagina() {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  return page;
}
async function ir(page, hash) {
  await page.goto(`${BASE}/#/${hash}`);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(600);
  await dismiss(page);
  await page.waitForTimeout(300);
}
async function shot(page, id, n, label) {
  const f = `${id}_paso${n}_${label}.png`;
  await page.screenshot({ path: path.join(OUT, f) });
  return f;
}
// Quita el botón "X" del snackbar y los nombres de íconos (ligaduras Material) del texto leído del DOM.
const limpia = (s) =>
  s.replace(/\s*\bX\s*$/, '').replace(/\b(account_circle|shopping_cart)\b\s*/gi, '').replace(/\s+/g, ' ').trim();
const snack = async (page) =>
  limpia(await page.locator('.mat-mdc-snack-bar-label, simple-snack-bar').first().innerText().catch(() => ''));

async function rellenarRegistro(page, email, pw, pw2 = pw) {
  await page.locator('#emailControl').fill(email);
  await page.locator('#passwordControl').fill(pw);
  await page.locator('#repeatPasswordControl').fill(pw2);
  await page.locator('#securityQuestionControl').click();
  await page.locator('mat-option').first().click();
  await page.locator('#securityAnswerControl').fill('respuesta');
  await page.locator('#securityAnswerControl').blur();
}
const errores = async (page) => (await page.locator('mat-error').allInnerTexts()).map((t) => t.trim()).filter(Boolean);

// Renderiza una evidencia de API (petición/respuesta real) como imagen
async function shotApi(id, titulo, peticion, status, cuerpo) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 480 } });
  const p = await ctx.newPage();
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await p.setContent(`<body style="font-family:Consolas,monospace;padding:20px;background:#0f172a;color:#e2e8f0">
    <h3 style="color:#38bdf8;margin:0 0 10px">${esc(titulo)}</h3>
    <div style="color:#94a3b8">PETICIÓN</div><pre style="background:#1e293b;padding:10px;white-space:pre-wrap">${esc(peticion)}</pre>
    <div style="color:#94a3b8">RESPUESTA REAL DEL SISTEMA — HTTP ${status}</div>
    <pre style="background:#1e293b;padding:10px;white-space:pre-wrap">${esc(cuerpo.slice(0, 900))}</pre></body>`);
  const f = `${id}_api_evidencia.png`;
  await p.screenshot({ path: path.join(OUT, f) });
  await ctx.close();
  return f;
}

async function caso(def, fn) {
  const r = { ...def, evidencias: [] };
  const page = await nuevaPagina();
  try {
    await fn(page, r);
  } catch (e) {
    r.obtenido = `Error durante la ejecución: ${String(e.message).split('\n')[0]}`;
    r.estado = 'Fallido';
    try { r.evidencias.push(await shot(page, def.id, 'error', 'fallo')); } catch {}
  }
  await page.context().close();
  results.push(r);
  console.log(`${r.estado.padEnd(9)} ${r.id}  ${r.nombre}  ->  ${r.obtenido}`);
}

// ---------- RF-01 Registro (UI) ----------
await caso({
  id: 'MC-01', nombre: 'Registro con datos válidos', req: 'RF-01', tecnica: 'Partición de equivalencia (clase válida)',
  objetivo: 'Verificar que un usuario puede registrarse con datos válidos.',
  pre: 'Sistema accesible; correo no registrado.',
  entrada: 'Correo único válido; contraseña "Passw0rd!" (9 car.); misma confirmación; pregunta de seguridad y respuesta.',
  pasos: ['Abrir /#/register', 'Completar el formulario con los datos de entrada', 'Pulsar "Register"'],
  esperado: 'El sistema crea la cuenta, redirige a la pantalla de login y muestra un mensaje de registro exitoso.',
}, async (page, r) => {
  const email = `mc01.${uniq()}@qa-test.com`;
  usuarioMC01 = email;
  await ir(page, 'register');
  await rellenarRegistro(page, email, PASS);
  r.evidencias.push(await shot(page, r.id, 1, 'formulario_completo'));
  await page.locator('#registerButton').click();
  await page.waitForURL(/#\/login/);
  await page.waitForTimeout(400);
  const msg = await snack(page);
  r.evidencias.push(await shot(page, r.id, 2, 'resultado'));
  r.obtenido = `Redirigió a /login y mostró: "${msg}"`;
  r.estado = /login/.test(page.url()) && /success/i.test(msg) ? 'Aprobado' : 'Fallido';
});

const casoPass = async (id, n, tecnica, aceptar) =>
  caso({
    id, nombre: `Registro con contraseña de ${n} caracteres`, req: 'RF-01', tecnica,
    objetivo: `Verificar el comportamiento del formulario con una contraseña de ${n} caracteres (regla: 5 a 40).`,
    pre: 'Sistema accesible.',
    entrada: `Correo único válido; contraseña de ${n} caracteres "a"; confirmación igual.`,
    pasos: ['Abrir /#/register', `Escribir una contraseña de ${n} caracteres y repetirla`, 'Completar pregunta/respuesta de seguridad', 'Observar errores y estado del botón Register'],
    esperado: aceptar ? 'Sin errores; el botón Register queda habilitado y el registro se completa.' : 'Se muestra error de longitud y el botón Register permanece deshabilitado.',
  }, async (page, r) => {
    await ir(page, 'register');
    await rellenarRegistro(page, `mc.${n}.${uniq()}@qa-test.com`, 'a'.repeat(n));
    await page.waitForTimeout(400);
    const errs = await errores(page);
    const deshabilitado = await page.locator('#registerButton').isDisabled();
    r.evidencias.push(await shot(page, r.id, 1, 'formulario'));
    if (aceptar) {
      await page.locator('#registerButton').click().catch(() => {});
      await page.waitForURL(/#\/login/, { timeout: 5000 }).catch(() => {});
      r.evidencias.push(await shot(page, r.id, 2, 'resultado'));
      r.obtenido = `Errores: ${errs.length ? errs.join(' | ') : 'ninguno'}. Botón ${deshabilitado ? 'deshabilitado' : 'habilitado'}. URL final: ${page.url().split('#')[1]}`;
      r.estado = !deshabilitado && /login/.test(page.url()) ? 'Aprobado' : 'Fallido';
    } else {
      r.obtenido = `Errores: ${errs.length ? errs.join(' | ') : 'ninguno'}. Botón Register ${deshabilitado ? 'deshabilitado' : 'habilitado'}.`;
      r.estado = deshabilitado && errs.some((e) => /5-40|characters/i.test(e)) ? 'Aprobado' : 'Fallido';
    }
  });
await casoPass('MC-02', 4, 'Valores límite: límite inferior − 1', false);
await casoPass('MC-03', 5, 'Valores límite: límite inferior', true);
await casoPass('MC-04', 40, 'Valores límite: límite superior', true);

await caso({
  id: 'MC-05', nombre: 'Registro con contraseña de 41 caracteres', req: 'RF-01', tecnica: 'Valores límite: límite superior + 1',
  objetivo: 'Verificar que el formulario no admite contraseñas de más de 40 caracteres.',
  pre: 'Sistema accesible.',
  entrada: 'Contraseña de 41 caracteres "a" en el campo contraseña.',
  pasos: ['Abrir /#/register', 'Escribir 41 caracteres en el campo contraseña', 'Revisar cuántos caracteres quedan en el campo'],
  esperado: 'El campo no acepta más de 40 caracteres (queda truncado o se rechaza).',
}, async (page, r) => {
  await ir(page, 'register');
  await page.locator('#passwordControl').pressSequentially('a'.repeat(41));
  const len = (await page.locator('#passwordControl').inputValue()).length;
  r.evidencias.push(await shot(page, r.id, 1, 'campo_contrasena'));
  r.obtenido = `El campo contiene ${len} caracteres de los 41 escritos (atributo maxlength=40).`;
  r.estado = len <= 40 ? 'Aprobado' : 'Fallido';
});

await caso({
  id: 'MC-06', nombre: 'Registro con correo de formato inválido', req: 'RF-01', tecnica: 'Partición de equivalencia (clase inválida)',
  objetivo: 'Verificar la validación del formato del correo en el formulario.',
  pre: 'Sistema accesible.',
  entrada: 'Correo "sinarroba"; contraseña válida.',
  pasos: ['Abrir /#/register', 'Escribir "sinarroba" en el campo correo', 'Completar el resto del formulario', 'Observar error y botón'],
  esperado: 'Se muestra un error de correo inválido y el botón Register permanece deshabilitado.',
}, async (page, r) => {
  await ir(page, 'register');
  await rellenarRegistro(page, 'sinarroba', PASS);
  await page.waitForTimeout(400);
  const errs = await errores(page);
  const des = await page.locator('#registerButton').isDisabled();
  r.evidencias.push(await shot(page, r.id, 1, 'error_correo'));
  r.obtenido = `Errores: ${errs.join(' | ') || 'ninguno'}. Botón ${des ? 'deshabilitado' : 'habilitado'}.`;
  r.estado = des && errs.length > 0 ? 'Aprobado' : 'Fallido';
});

await caso({
  id: 'MC-07', nombre: 'Registro con confirmación de contraseña distinta', req: 'RF-01', tecnica: 'Partición de equivalencia (clase inválida)',
  objetivo: 'Verificar que la confirmación debe coincidir con la contraseña.',
  pre: 'Sistema accesible.',
  entrada: 'Contraseña "Passw0rd!"; confirmación "Passw0rd?".',
  pasos: ['Abrir /#/register', 'Completar con contraseñas distintas', 'Observar error y botón'],
  esperado: 'Se muestra "Passwords do not match" y el botón queda deshabilitado.',
}, async (page, r) => {
  await ir(page, 'register');
  await rellenarRegistro(page, `mc07.${uniq()}@qa-test.com`, PASS, 'Passw0rd?');
  await page.waitForTimeout(400);
  const errs = await errores(page);
  const des = await page.locator('#registerButton').isDisabled();
  r.evidencias.push(await shot(page, r.id, 1, 'error_confirmacion'));
  r.obtenido = `Errores: ${errs.join(' | ') || 'ninguno'}. Botón ${des ? 'deshabilitado' : 'habilitado'}.`;
  r.estado = des && errs.some((e) => /match/i.test(e)) ? 'Aprobado' : 'Fallido';
});

// ---------- RF-02 Login ----------
await caso({
  id: 'MC-08', nombre: 'Login con credenciales válidas', req: 'RF-02', tecnica: 'Partición de equivalencia (clase válida)',
  objetivo: 'Verificar que un usuario registrado puede iniciar sesión.',
  pre: 'Usuario creado en MC-01.',
  entrada: 'Correo y contraseña del usuario de MC-01.',
  pasos: ['Abrir /#/login', 'Escribir correo y contraseña', 'Pulsar "Log in"', 'Abrir el menú Account'],
  esperado: 'Se accede a la tienda y el menú de cuenta muestra el correo del usuario.',
}, async (page, r) => {
  await ir(page, 'login');
  await page.locator('#email').fill(usuarioMC01);
  await page.locator('#password').fill(PASS);
  r.evidencias.push(await shot(page, r.id, 1, 'credenciales'));
  await page.locator('#loginButton').click();
  await page.waitForURL(/#\/search/);
  await page.locator('#navbarAccount').click();
  await page.waitForTimeout(500);
  const cuenta = limpia(await page.locator('button[aria-label="Go to user profile"]').innerText());
  r.evidencias.push(await shot(page, r.id, 2, 'sesion_iniciada'));
  r.obtenido = `Redirigió a /search. El menú de cuenta muestra: "${cuenta}"`;
  r.estado = cuenta.includes(usuarioMC01) ? 'Aprobado' : 'Fallido';
});

await caso({
  id: 'MC-09', nombre: 'Login con contraseña incorrecta', req: 'RF-02', tecnica: 'Partición de equivalencia (clase inválida)',
  objetivo: 'Verificar que se rechazan credenciales inválidas con un mensaje claro.',
  pre: 'Usuario creado en MC-01.',
  entrada: 'Correo válido; contraseña "Incorrecta123".',
  pasos: ['Abrir /#/login', 'Escribir correo válido y contraseña incorrecta', 'Pulsar "Log in"'],
  esperado: 'No se inicia sesión y se muestra el mensaje "Invalid email or password."',
}, async (page, r) => {
  await ir(page, 'login');
  await page.locator('#email').fill(usuarioMC01);
  await page.locator('#password').fill('Incorrecta123');
  await page.locator('#loginButton').click();
  await page.waitForTimeout(800);
  const err = (await page.locator('.error').first().innerText().catch(() => '')).trim();
  r.evidencias.push(await shot(page, r.id, 1, 'mensaje_error'));
  r.obtenido = `Permaneció en ${page.url().split('#')[1]}. Mensaje: "${err}"`;
  r.estado = /invalid email or password/i.test(err) && /login/.test(page.url()) ? 'Aprobado' : 'Fallido';
});

// ---------- RF-03 Búsqueda ----------
async function buscar(page, texto) {
  await ir(page, 'search');
  await page.locator('button[aria-label="Open search"]').click();
  const box = page.locator('input').filter({ hasNot: page.locator('[type=hidden]') }).last();
  await page.locator('#searchQuery input, mat-form-field input').last().fill(texto);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
}
await caso({
  id: 'MC-10', nombre: 'Búsqueda con término existente', req: 'RF-03', tecnica: 'Partición de equivalencia (clase válida)',
  objetivo: 'Verificar que la búsqueda devuelve los productos relacionados.',
  pre: 'Sistema accesible.',
  entrada: 'Texto de búsqueda: "apple".',
  pasos: ['Abrir la tienda', 'Pulsar el ícono de búsqueda', 'Escribir "apple" y Enter'],
  esperado: 'Se listan productos cuyo nombre o descripción contienen "apple".',
}, async (page, r) => {
  await buscar(page, 'apple');
  const nombres = (await page.locator('app-product div.name').allInnerTexts()).map((t) => t.trim());
  r.evidencias.push(await shot(page, r.id, 1, 'resultados'));
  r.obtenido = `${nombres.length} producto(s): ${nombres.join('; ')}`;
  r.estado = nombres.length > 0 ? 'Aprobado' : 'Fallido';
});

await caso({
  id: 'MC-11', nombre: 'Búsqueda sin coincidencias', req: 'RF-03', tecnica: 'Partición de equivalencia (clase sin resultados)',
  objetivo: 'Verificar el mensaje cuando no hay coincidencias.',
  pre: 'Sistema accesible.',
  entrada: 'Texto de búsqueda: "zzzxxxqqq".',
  pasos: ['Abrir la tienda', 'Buscar "zzzxxxqqq"'],
  esperado: 'No se listan productos y se informa al usuario "No results found".',
}, async (page, r) => {
  await buscar(page, 'zzzxxxqqq');
  const texto = (await page.locator('app-search-result').innerText()).replace(/\s+/g, ' ');
  const n = await page.locator('app-product').count();
  r.evidencias.push(await shot(page, r.id, 1, 'sin_resultados'));
  r.obtenido = `${n} producto(s). Texto en pantalla: "${texto.slice(0, 120)}"`;
  r.estado = n === 0 && /no results/i.test(texto) ? 'Aprobado' : 'Fallido';
});

// ---------- RF-04 Carrito ----------
await caso({
  id: 'MC-12', nombre: 'Agregar producto al carrito', req: 'RF-04', tecnica: 'Partición de equivalencia (clase válida)',
  objetivo: 'Verificar que un usuario autenticado puede agregar un producto al carrito.',
  pre: 'Usuario de MC-01 con carrito vacío.',
  entrada: 'Primer producto del catálogo, cantidad 1.',
  pasos: ['Iniciar sesión', 'Pulsar "Add to Basket" en el primer producto', 'Observar el contador del carrito'],
  esperado: 'Se confirma el agregado y el contador del carrito pasa de 0 a 1.',
}, async (page, r) => {
  await ir(page, 'login');
  await page.locator('#email').fill(usuarioMC01);
  await page.locator('#password').fill(PASS);
  await page.locator('#loginButton').click();
  await page.waitForURL(/#\/search/);
  await page.waitForTimeout(1500);
  await dismiss(page);
  r.evidencias.push(await shot(page, r.id, 1, 'carrito_inicial'));
  await page.locator('button[aria-label="Add to Basket"]').first().click();
  await page.waitForTimeout(1200);
  const msg = await snack(page);
  const contador = limpia(await page.locator('button[aria-label="Show the shopping cart"]').innerText());
  r.evidencias.push(await shot(page, r.id, 2, 'producto_agregado'));
  r.obtenido = `Mensaje: "${msg}". Botón del carrito: "${contador}"`;
  r.estado = /\b1\b/.test(contador) ? 'Aprobado' : 'Fallido';
});

// ---------- RF-05 Feedback ----------
await caso({
  id: 'MC-13', nombre: 'Feedback con comentario en el límite de 160 caracteres', req: 'RF-05', tecnica: 'Valores límite: límite superior (y +1)',
  objetivo: 'Verificar el límite de 160 caracteres del comentario y el envío exitoso.',
  pre: 'Sistema accesible.',
  entrada: 'Comentario de 170 caracteres escritos (se espera truncado a 160); calificación; CAPTCHA resuelto.',
  pasos: ['Abrir /#/contact', 'Escribir 170 caracteres en el comentario', 'Fijar la calificación', 'Resolver el CAPTCHA y pulsar Submit'],
  esperado: 'El campo acepta máximo 160 caracteres y el feedback se envía con mensaje de agradecimiento.',
}, async (page, r) => {
  await ir(page, 'contact');
  await page.locator('#comment').pressSequentially('x'.repeat(170));
  const len = (await page.locator('#comment').inputValue()).length;
  const slider = page.locator('mat-slider input').first();
  await slider.focus();
  await page.keyboard.press('End');
  const captchaTxt = (await page.locator('#captcha').innerText()).trim();
  const respuesta = Function(`"use strict"; return (${captchaTxt.replace(/[^0-9+\-*/() ]/g, '')})`)();
  await page.locator('#captchaControl').fill(String(respuesta));
  r.evidencias.push(await shot(page, r.id, 1, 'formulario'));
  await page.locator('#submitButton').click();
  await page.waitForTimeout(1000);
  const msg = await snack(page);
  r.evidencias.push(await shot(page, r.id, 2, 'resultado'));
  r.obtenido = `Comentario con ${len} caracteres. CAPTCHA "${captchaTxt}" = ${respuesta}. Mensaje: "${msg}"`;
  r.estado = len === 160 && /thank you/i.test(msg) ? 'Aprobado' : 'Fallido';
});

// ---------- Seguridad / validación servidor ----------
await caso({
  id: 'MC-14', nombre: 'Validación en servidor: contraseña de 4 caracteres (API)', req: 'RF-01 / RNF-02', tecnica: 'Valores límite: límite inferior − 1 (capa API)',
  objetivo: 'Verificar que la regla de 5–40 caracteres también se aplica en el servidor y no solo en la interfaz.',
  pre: 'Sistema accesible.',
  entrada: 'POST /api/Users con contraseña "abcd" (4 caracteres).',
  pasos: ['Enviar la petición de registro directamente a la API, sin pasar por el formulario', 'Leer el código de estado'],
  esperado: 'El servidor rechaza la petición (HTTP 400).',
}, async (page, r) => {
  const email = `mc14.${uniq()}@qa-test.com`;
  const body = { email, password: 'abcd', passwordRepeat: 'abcd', securityQuestion: { id: 1 }, securityAnswer: 'x' };
  const res = await page.request.post(`${BASE}/api/Users/`, { data: body });
  const txt = await res.text();
  r.evidencias.push(await shotApi(r.id, 'Registro con contraseña de 4 caracteres directo a la API', `POST ${BASE}/api/Users/\n${JSON.stringify(body)}`, res.status(), txt));
  r.obtenido = `HTTP ${res.status()}: el servidor ${res.status() === 201 ? 'CREÓ la cuenta' : 'rechazó la petición'}.`;
  r.estado = res.status() === 400 ? 'Aprobado' : 'Fallido';
});

await caso({
  id: 'MC-15', nombre: 'Login con payload de inyección SQL', req: 'RNF-02 (OWASP A03)', tecnica: 'Pruebas de seguridad: partición clase inválida/maliciosa',
  objetivo: 'Verificar que el login no es vulnerable a inyección SQL.',
  pre: 'Sistema accesible; no hay sesión iniciada.',
  entrada: "Correo: ' or 1=1--   Contraseña: x",
  pasos: ['Abrir /#/login', "Escribir el payload en el campo correo y cualquier contraseña", 'Pulsar Log in', 'Abrir el menú Account'],
  esperado: 'El acceso es rechazado con "Invalid email or password.".',
}, async (page, r) => {
  await ir(page, 'login');
  await page.locator('#email').fill("' or 1=1--");
  await page.locator('#password').fill('x');
  r.evidencias.push(await shot(page, r.id, 1, 'payload'));
  await page.locator('#loginButton').click();
  await page.waitForTimeout(1500);
  await page.locator('#navbarAccount').click().catch(() => {});
  await page.waitForTimeout(500);
  const cuenta = limpia(await page.locator('button[aria-label="Go to user profile"]').innerText().catch(() => ''));
  r.evidencias.push(await shot(page, r.id, 2, 'resultado'));
  r.obtenido = `URL: ${page.url().split('#')[1]}. Sesión iniciada como: "${cuenta || '(ninguna)'}"`;
  r.estado = cuenta ? 'Fallido' : 'Aprobado';
});

await caso({
  id: 'MC-16', nombre: 'XSS reflejado en el campo de búsqueda', req: 'RNF-02 (OWASP A03)', tecnica: 'Pruebas de seguridad: entrada maliciosa',
  objetivo: 'Verificar que el texto de búsqueda se muestra como texto y no se ejecuta como código.',
  pre: 'Sistema accesible.',
  entrada: `<iframe src="javascript:alert('xss')">`,
  pasos: ['Abrir /#/search?q=<payload>', 'Observar si el navegador ejecuta el script (aparece un diálogo alert)'],
  esperado: 'No se ejecuta ningún script; el texto se muestra escapado.',
}, async (page, r) => {
  let dialogo = null;
  page.on('dialog', async (d) => { dialogo = d.message(); await d.dismiss().catch(() => {}); });
  await page.goto(`${BASE}/#/search?q=${encodeURIComponent(`<iframe src="javascript:alert('xss')">`)}`);
  await page.waitForTimeout(2500);
  await dismiss(page);
  r.evidencias.push(await shot(page, r.id, 1, 'resultado'));
  r.obtenido = dialogo ? `El navegador ejecutó el script: apareció un alert con el texto "${dialogo}".` : 'No se ejecutó ningún script.';
  r.estado = dialogo ? 'Fallido' : 'Aprobado';
});

fs.writeFileSync(path.join(OUT, 'resultados-manuales.json'), JSON.stringify(results, null, 2), 'utf8');
const ap = results.filter((x) => x.estado === 'Aprobado').length;
console.log(`\nResumen manuales: ${results.length} casos, ${ap} aprobados, ${results.length - ap} fallidos`);
await browser.close();
