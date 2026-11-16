// Utilidades compartidas por las pruebas automatizadas.
export const uniqueEmail = (prefix = 'qa') =>
  `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@qa-test.com`;

export const VALID_PASSWORD = 'Passw0rd!';

/** Registra un usuario vía API. Devuelve la respuesta cruda. */
export async function registerViaApi(request, email, password) {
  return request.post('/api/Users/', {
    data: {
      email,
      password,
      passwordRepeat: password,
      securityQuestion: { id: 1 },
      securityAnswer: 'qa',
    },
  });
}

/** Inicia sesión vía API. Devuelve { token, basketId } o null si falla. */
export async function loginViaApi(request, email, password) {
  const res = await request.post('/rest/user/login', { data: { email, password } });
  if (!res.ok()) return null;
  const body = await res.json();
  return { token: body.authentication.token, basketId: body.authentication.bid };
}

/** Cierra el banner de bienvenida y el aviso de cookies. */
export async function dismissDialogs(page) {
  const welcome = page.locator('button[aria-label="Close Welcome Banner"]');
  if (await welcome.count()) await welcome.first().click().catch(() => {});
  const cookie = page.locator('a[aria-label="dismiss cookie message"]');
  if (await cookie.count()) await cookie.first().click().catch(() => {});
}

/** Abre una ruta de la SPA y limpia los diálogos iniciales. */
export async function openPage(page, hash) {
  await page.goto(`/#/${hash}`);
  await page.waitForLoadState('networkidle').catch(() => {});
  await dismissDialogs(page);
}
