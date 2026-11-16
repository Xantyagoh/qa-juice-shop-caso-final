import { test, expect } from '@playwright/test';
import { uniqueEmail, VALID_PASSWORD, registerViaApi, loginViaApi } from './helpers.js';

// RF-04: Carrito de compras. RF-05: Envío de feedback con comentario de máximo 160 caracteres y CAPTCHA.
test.describe('RF-04 Carrito (API)', () => {
  test('AT-14 Agregar un producto al carrito lo refleja en el contenido del carrito', async ({ request }) => {
    const email = uniqueEmail('cart');
    await registerViaApi(request, email, VALID_PASSWORD);
    const session = await loginViaApi(request, email, VALID_PASSWORD);
    expect(session).not.toBeNull();
    const headers = { Authorization: `Bearer ${session.token}` };

    const add = await request.post('/api/BasketItems/', {
      headers,
      data: { ProductId: 1, BasketId: String(session.basketId), quantity: 2 },
    });
    expect(add.status()).toBe(200);

    const basket = await request.get(`/rest/basket/${session.basketId}`, { headers });
    const { data } = await basket.json();
    expect(data.Products).toHaveLength(1);
    expect(data.Products[0].BasketItem.quantity).toBe(2);
  });

  test('AT-15 Un usuario NO puede ver el carrito de otro usuario (control de acceso)', async ({ request }) => {
    const a = uniqueEmail('ownerA');
    const b = uniqueEmail('ownerB');
    await registerViaApi(request, a, VALID_PASSWORD);
    await registerViaApi(request, b, VALID_PASSWORD);
    const sa = await loginViaApi(request, a, VALID_PASSWORD);
    const sb = await loginViaApi(request, b, VALID_PASSWORD);
    const res = await request.get(`/rest/basket/${sa.basketId}`, {
      headers: { Authorization: `Bearer ${sb.token}` },
    });
    console.log(`Usuario B consulta carrito de A -> status=${res.status()}`);
    expect([401, 403]).toContain(res.status());
  });
});

test.describe('RF-05 Feedback (API) - valores límite del comentario', () => {
  async function enviarFeedback(request, longitud) {
    const cap = await (await request.get('/rest/captcha/')).json();
    return request.post('/api/Feedbacks/', {
      data: {
        comment: 'x'.repeat(longitud),
        rating: 3,
        captchaId: cap.captchaId,
        captcha: String(cap.answer),
      },
    });
  }

  test('AT-16 Comentario de 160 caracteres (límite superior) es aceptado', async ({ request }) => {
    const res = await enviarFeedback(request, 160);
    expect(res.status()).toBe(201);
  });

  test('AT-17 Comentario de 161 caracteres (límite superior + 1) es rechazado', async ({ request }) => {
    const res = await enviarFeedback(request, 161);
    console.log(`comentario 161 -> status=${res.status()}`);
    expect(res.status()).toBe(400);
  });

  test('AT-18 Calificación fuera de rango (0) es rechazada', async ({ request }) => {
    const cap = await (await request.get('/rest/captcha/')).json();
    const res = await request.post('/api/Feedbacks/', {
      data: { comment: 'fuera de rango', rating: 0, captchaId: cap.captchaId, captcha: String(cap.answer) },
    });
    console.log(`rating 0 -> status=${res.status()}`);
    expect(res.status()).toBe(400);
  });
});
