# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: basket-feedback.spec.js >> RF-04 Carrito (API) >> AT-15 Un usuario NO puede ver el carrito de otro usuario (control de acceso)
- Location: tests\basket-feedback.spec.js:25:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 200
Received array: [401, 403]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { uniqueEmail, VALID_PASSWORD, registerViaApi, loginViaApi } from './helpers.js';
  3  | 
  4  | // RF-04: Carrito de compras. RF-05: Envío de feedback con comentario de máximo 160 caracteres y CAPTCHA.
  5  | test.describe('RF-04 Carrito (API)', () => {
  6  |   test('AT-14 Agregar un producto al carrito lo refleja en el contenido del carrito', async ({ request }) => {
  7  |     const email = uniqueEmail('cart');
  8  |     await registerViaApi(request, email, VALID_PASSWORD);
  9  |     const session = await loginViaApi(request, email, VALID_PASSWORD);
  10 |     expect(session).not.toBeNull();
  11 |     const headers = { Authorization: `Bearer ${session.token}` };
  12 | 
  13 |     const add = await request.post('/api/BasketItems/', {
  14 |       headers,
  15 |       data: { ProductId: 1, BasketId: String(session.basketId), quantity: 2 },
  16 |     });
  17 |     expect(add.status()).toBe(200);
  18 | 
  19 |     const basket = await request.get(`/rest/basket/${session.basketId}`, { headers });
  20 |     const { data } = await basket.json();
  21 |     expect(data.Products).toHaveLength(1);
  22 |     expect(data.Products[0].BasketItem.quantity).toBe(2);
  23 |   });
  24 | 
  25 |   test('AT-15 Un usuario NO puede ver el carrito de otro usuario (control de acceso)', async ({ request }) => {
  26 |     const a = uniqueEmail('ownerA');
  27 |     const b = uniqueEmail('ownerB');
  28 |     await registerViaApi(request, a, VALID_PASSWORD);
  29 |     await registerViaApi(request, b, VALID_PASSWORD);
  30 |     const sa = await loginViaApi(request, a, VALID_PASSWORD);
  31 |     const sb = await loginViaApi(request, b, VALID_PASSWORD);
  32 |     const res = await request.get(`/rest/basket/${sa.basketId}`, {
  33 |       headers: { Authorization: `Bearer ${sb.token}` },
  34 |     });
  35 |     console.log(`Usuario B consulta carrito de A -> status=${res.status()}`);
> 36 |     expect([401, 403]).toContain(res.status());
     |                        ^ Error: expect(received).toContain(expected) // indexOf
  37 |   });
  38 | });
  39 | 
  40 | test.describe('RF-05 Feedback (API) - valores límite del comentario', () => {
  41 |   async function enviarFeedback(request, longitud) {
  42 |     const cap = await (await request.get('/rest/captcha/')).json();
  43 |     return request.post('/api/Feedbacks/', {
  44 |       data: {
  45 |         comment: 'x'.repeat(longitud),
  46 |         rating: 3,
  47 |         captchaId: cap.captchaId,
  48 |         captcha: String(cap.answer),
  49 |       },
  50 |     });
  51 |   }
  52 | 
  53 |   test('AT-16 Comentario de 160 caracteres (límite superior) es aceptado', async ({ request }) => {
  54 |     const res = await enviarFeedback(request, 160);
  55 |     expect(res.status()).toBe(201);
  56 |   });
  57 | 
  58 |   test('AT-17 Comentario de 161 caracteres (límite superior + 1) es rechazado', async ({ request }) => {
  59 |     const res = await enviarFeedback(request, 161);
  60 |     console.log(`comentario 161 -> status=${res.status()}`);
  61 |     expect(res.status()).toBe(400);
  62 |   });
  63 | 
  64 |   test('AT-18 Calificación fuera de rango (0) es rechazada', async ({ request }) => {
  65 |     const cap = await (await request.get('/rest/captcha/')).json();
  66 |     const res = await request.post('/api/Feedbacks/', {
  67 |       data: { comment: 'fuera de rango', rating: 0, captchaId: cap.captchaId, captcha: String(cap.answer) },
  68 |     });
  69 |     console.log(`rating 0 -> status=${res.status()}`);
  70 |     expect(res.status()).toBe(400);
  71 |   });
  72 | });
  73 | 
```