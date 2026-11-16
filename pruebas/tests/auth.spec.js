import { test, expect } from '@playwright/test';
import { uniqueEmail, VALID_PASSWORD, registerViaApi, openPage } from './helpers.js';

// RF-02: El sistema debe permitir iniciar sesión con credenciales válidas y rechazar las inválidas.
test.describe('RF-02 Autenticación (UI)', () => {
  let email;
  test.beforeAll(async ({ request }) => {
    email = uniqueEmail('auth');
    const res = await registerViaApi(request, email, VALID_PASSWORD);
    expect(res.status()).toBe(201);
  });

  test('AT-01 Login válido redirige a la tienda y muestra la sesión', async ({ page }) => {
    await openPage(page, 'login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(VALID_PASSWORD);
    await page.locator('#loginButton').click();
    await expect(page).toHaveURL(/#\/search/);
    await page.locator('#navbarAccount').click();
    await expect(page.locator('button[aria-label="Go to user profile"]')).toContainText(email);
  });

  test('AT-02 Login con contraseña incorrecta es rechazado con mensaje claro', async ({ page }) => {
    await openPage(page, 'login');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('ContraseñaIncorrecta1');
    await page.locator('#loginButton').click();
    await expect(page.locator('.error')).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/#\/login/);
  });
});
