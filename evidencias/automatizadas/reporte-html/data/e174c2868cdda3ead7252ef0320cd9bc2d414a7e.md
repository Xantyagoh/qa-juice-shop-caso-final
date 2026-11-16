# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: registration.spec.js >> RF-01 Registro - validación de correo en el servidor (EP) >> AT-10 Correo inválido: sin @ debe ser rechazado
- Location: tests\registration.spec.js:37:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 201
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { uniqueEmail, registerViaApi } from './helpers.js';
  3  | 
  4  | // RF-01: Registro de usuarios. Regla: contraseña de 5 a 40 caracteres y correo con formato válido.
  5  | // El servidor debe validar estas reglas (no puede confiar solo en la interfaz).
  6  | // Técnicas: partición de equivalencia + valores límite (4, 5, 40, 41).
  7  | const casosContrasena = [
  8  |   { id: 'AT-06', longitud: 4, valida: false, tecnica: 'Límite inferior - 1' },
  9  |   { id: 'AT-07', longitud: 5, valida: true, tecnica: 'Límite inferior' },
  10 |   { id: 'AT-08', longitud: 40, valida: true, tecnica: 'Límite superior' },
  11 |   { id: 'AT-09', longitud: 41, valida: false, tecnica: 'Límite superior + 1' },
  12 | ];
  13 | 
  14 | test.describe('RF-01 Registro - validación de contraseña en el servidor (BVA)', () => {
  15 |   for (const c of casosContrasena) {
  16 |     test(`${c.id} Contraseña de ${c.longitud} caracteres (${c.tecnica}) -> ${c.valida ? 'aceptada' : 'rechazada'}`, async ({ request }) => {
  17 |       const res = await registerViaApi(request, uniqueEmail('bva'), 'a'.repeat(c.longitud));
  18 |       console.log(`longitud=${c.longitud} status=${res.status()}`);
  19 |       if (c.valida) expect(res.status()).toBe(201);
  20 |       else expect(res.status()).toBe(400);
  21 |     });
  22 |   }
  23 | });
  24 | 
  25 | // Partición de equivalencia sobre el formato del correo
  26 | // Cada correo es único por ejecución para que un 400 solo pueda deberse a la validación de formato
  27 | // (y no a que el correo ya estuviera registrado).
  28 | const sufijo = () => `${Date.now()}${Math.floor(Math.random() * 1e4)}`;
  29 | const casosEmail = [
  30 |   { id: 'AT-10', email: () => 'sinarroba' + sufijo(), clase: 'inválido: sin @' },
  31 |   { id: 'AT-11', email: () => `@dominio${sufijo()}.com`, clase: 'inválido: sin parte local' },
  32 |   { id: 'AT-12', email: () => `usuario${sufijo()}@dominio`, clase: 'inválido: dominio sin punto' },
  33 | ];
  34 | 
  35 | test.describe('RF-01 Registro - validación de correo en el servidor (EP)', () => {
  36 |   for (const c of casosEmail) {
  37 |     test(`${c.id} Correo ${c.clase} debe ser rechazado`, async ({ request }) => {
  38 |       const res = await registerViaApi(request, c.email(), 'Passw0rd!');
  39 |       console.log(`email inválido status=${res.status()}`);
> 40 |       expect(res.status()).toBe(400);
     |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  41 |     });
  42 |   }
  43 | 
  44 |   test('AT-13 Correo duplicado debe ser rechazado', async ({ request }) => {
  45 |     const email = uniqueEmail('dup');
  46 |     expect((await registerViaApi(request, email, 'Passw0rd!')).status()).toBe(201);
  47 |     expect((await registerViaApi(request, email, 'Passw0rd!')).status()).toBe(400);
  48 |   });
  49 | });
  50 | 
```