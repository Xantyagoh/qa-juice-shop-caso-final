# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.js >> RNF-02 Seguridad básica >> AT-19 A03 Inyección SQL: el login con payload SQL NO debe autenticar
- Location: tests\security.spec.js:5:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 200
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // RNF-02: Seguridad (OWASP Top 10 2021).
  4  | test.describe('RNF-02 Seguridad básica', () => {
  5  |   test('AT-19 A03 Inyección SQL: el login con payload SQL NO debe autenticar', async ({ request }) => {
  6  |     const res = await request.post('/rest/user/login', {
  7  |       data: { email: "' OR 1=1--", password: 'cualquiera' },
  8  |     });
  9  |     console.log(`Login con SQLi -> status=${res.status()}`);
> 10 |     expect(res.status()).toBe(401);
     |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  11 |   });
  12 | 
  13 |   test('AT-20 A05 Configuración: la respuesta debe incluir cabeceras de seguridad', async ({ request }) => {
  14 |     const res = await request.get('/');
  15 |     const h = res.headers();
  16 |     console.log(JSON.stringify({
  17 |       csp: h['content-security-policy'] ?? null,
  18 |       xcto: h['x-content-type-options'] ?? null,
  19 |       xfo: h['x-frame-options'] ?? null,
  20 |       hsts: h['strict-transport-security'] ?? null,
  21 |     }));
  22 |     expect.soft(h['x-content-type-options'], 'X-Content-Type-Options').toBe('nosniff');
  23 |     expect.soft(h['content-security-policy'], 'Content-Security-Policy').toBeTruthy();
  24 |     expect.soft(h['x-frame-options'], 'X-Frame-Options').toBeTruthy();
  25 |   });
  26 | 
  27 |   test('AT-21 A01 Control de acceso: /api/Users sin token no debe listar usuarios', async ({ request }) => {
  28 |     const res = await request.get('/api/Users/');
  29 |     console.log(`GET /api/Users sin token -> status=${res.status()}`);
  30 |     expect([401, 403]).toContain(res.status());
  31 |   });
  32 | });
  33 | 
```