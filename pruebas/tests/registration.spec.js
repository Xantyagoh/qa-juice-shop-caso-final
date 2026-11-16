import { test, expect } from '@playwright/test';
import { uniqueEmail, registerViaApi } from './helpers.js';

// RF-01: Registro de usuarios. Regla: contraseña de 5 a 40 caracteres y correo con formato válido.
// El servidor debe validar estas reglas (no puede confiar solo en la interfaz).
// Técnicas: partición de equivalencia + valores límite (4, 5, 40, 41).
const casosContrasena = [
  { id: 'AT-06', longitud: 4, valida: false, tecnica: 'Límite inferior - 1' },
  { id: 'AT-07', longitud: 5, valida: true, tecnica: 'Límite inferior' },
  { id: 'AT-08', longitud: 40, valida: true, tecnica: 'Límite superior' },
  { id: 'AT-09', longitud: 41, valida: false, tecnica: 'Límite superior + 1' },
];

test.describe('RF-01 Registro - validación de contraseña en el servidor (BVA)', () => {
  for (const c of casosContrasena) {
    test(`${c.id} Contraseña de ${c.longitud} caracteres (${c.tecnica}) -> ${c.valida ? 'aceptada' : 'rechazada'}`, async ({ request }) => {
      const res = await registerViaApi(request, uniqueEmail('bva'), 'a'.repeat(c.longitud));
      console.log(`longitud=${c.longitud} status=${res.status()}`);
      if (c.valida) expect(res.status()).toBe(201);
      else expect(res.status()).toBe(400);
    });
  }
});

// Partición de equivalencia sobre el formato del correo
// Cada correo es único por ejecución para que un 400 solo pueda deberse a la validación de formato
// (y no a que el correo ya estuviera registrado).
const sufijo = () => `${Date.now()}${Math.floor(Math.random() * 1e4)}`;
const casosEmail = [
  { id: 'AT-10', email: () => 'sinarroba' + sufijo(), clase: 'inválido: sin @' },
  { id: 'AT-11', email: () => `@dominio${sufijo()}.com`, clase: 'inválido: sin parte local' },
  { id: 'AT-12', email: () => `usuario${sufijo()}@dominio`, clase: 'inválido: dominio sin punto' },
];

test.describe('RF-01 Registro - validación de correo en el servidor (EP)', () => {
  for (const c of casosEmail) {
    test(`${c.id} Correo ${c.clase} debe ser rechazado`, async ({ request }) => {
      const res = await registerViaApi(request, c.email(), 'Passw0rd!');
      console.log(`email inválido status=${res.status()}`);
      expect(res.status()).toBe(400);
    });
  }

  test('AT-13 Correo duplicado debe ser rechazado', async ({ request }) => {
    const email = uniqueEmail('dup');
    expect((await registerViaApi(request, email, 'Passw0rd!')).status()).toBe(201);
    expect((await registerViaApi(request, email, 'Passw0rd!')).status()).toBe(400);
  });
});
