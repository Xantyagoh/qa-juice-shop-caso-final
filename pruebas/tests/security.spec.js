import { test, expect } from '@playwright/test';

// RNF-02: Seguridad (OWASP Top 10 2021).
test.describe('RNF-02 Seguridad básica', () => {
  test('AT-19 A03 Inyección SQL: el login con payload SQL NO debe autenticar', async ({ request }) => {
    const res = await request.post('/rest/user/login', {
      data: { email: "' OR 1=1--", password: 'cualquiera' },
    });
    console.log(`Login con SQLi -> status=${res.status()}`);
    expect(res.status()).toBe(401);
  });

  test('AT-20 A05 Configuración: la respuesta debe incluir cabeceras de seguridad', async ({ request }) => {
    const res = await request.get('/');
    const h = res.headers();
    console.log(JSON.stringify({
      csp: h['content-security-policy'] ?? null,
      xcto: h['x-content-type-options'] ?? null,
      xfo: h['x-frame-options'] ?? null,
      hsts: h['strict-transport-security'] ?? null,
    }));
    expect.soft(h['x-content-type-options'], 'X-Content-Type-Options').toBe('nosniff');
    expect.soft(h['content-security-policy'], 'Content-Security-Policy').toBeTruthy();
    expect.soft(h['x-frame-options'], 'X-Frame-Options').toBeTruthy();
  });

  test('AT-21 A01 Control de acceso: /api/Users sin token no debe listar usuarios', async ({ request }) => {
    const res = await request.get('/api/Users/');
    console.log(`GET /api/Users sin token -> status=${res.status()}`);
    expect([401, 403]).toContain(res.status());
  });
});
