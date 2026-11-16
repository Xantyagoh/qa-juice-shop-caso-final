import { test, expect } from '@playwright/test';

// RF-03: El sistema debe permitir buscar productos por texto.
// RNF-01: La búsqueda debe responder en menos de 1 segundo (usuario único).
test.describe('RF-03 Búsqueda de productos (API)', () => {
  test('AT-03 Búsqueda con término existente devuelve solo productos relacionados', async ({ request }) => {
    const res = await request.get('/rest/products/search?q=apple');
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data.length).toBeGreaterThan(0);
    for (const p of data) {
      expect(`${p.name} ${p.description}`.toLowerCase()).toContain('apple');
    }
  });

  test('AT-04 Búsqueda sin coincidencias devuelve lista vacía', async ({ request }) => {
    const res = await request.get('/rest/products/search?q=zzzxxxqqq');
    expect(res.status()).toBe(200);
    const { data } = await res.json();
    expect(data).toHaveLength(0);
  });

  test('AT-05 RNF-01: la búsqueda responde en menos de 1000 ms', async ({ request }) => {
    const t0 = Date.now();
    const res = await request.get('/rest/products/search?q=juice');
    const elapsed = Date.now() - t0;
    expect(res.status()).toBe(200);
    console.log(`Tiempo de respuesta búsqueda: ${elapsed} ms`);
    expect(elapsed).toBeLessThan(1000);
  });
});
