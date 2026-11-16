// Prueba de carga con k6 - RNF-01 (Rendimiento)
// Escenario: 20 usuarios virtuales concurrentes buscan productos durante 60 s (rampa de 10 s arriba y abajo).
// Cada usuario inicia una nueva búsqueda al terminar la anterior (con una pausa de 0.5 s).
// Criterios de aceptación (umbrales):
//   - p(95) del tiempo de respuesta < 1000 ms
//   - máximo (100 %) < 3000 ms
//   - tasa de errores HTTP < 1 %
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://host.docker.internal:3100';
const TERMINOS = ['apple', 'juice', 'banana', 'lemon', 'melon', 'orange', 'carrot', 'zzzxxx'];

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '60s', target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'max<3000'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const q = TERMINOS[Math.floor(Math.random() * TERMINOS.length)];
  const res = http.get(`${BASE}/rest/products/search?q=${q}`, { tags: { name: 'busqueda' } });
  check(res, {
    'status 200': (r) => r.status === 200,
    'respuesta JSON con data': (r) => Array.isArray(r.json('data')),
  });
  sleep(0.5);
}
