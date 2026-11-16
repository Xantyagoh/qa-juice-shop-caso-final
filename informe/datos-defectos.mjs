// Registro de defectos. Cada defecto se sustenta en un caso o hallazgo ejecutado (columna "evidencia").
// Severidad: Crítico | Alto | Medio | Bajo.  Prioridad: Alta | Media | Baja.
// Estado: Abierto | Corregido y verificado (en ambiente de prueba).
export const DEFECTOS_BASE = [
  {
    id: 'DEF-001', titulo: 'El servidor acepta contraseñas fuera del rango 5–40 caracteres',
    descripcion: 'POST /api/Users crea cuentas con contraseñas de 1 a 100 caracteres. La regla de 5–40 solo se aplica en el formulario (maxlength y validador de Angular); un cliente que llame a la API directamente la evita.',
    severidad: 'Alto', prioridad: 'Alta', estado: 'Corregido y verificado (ambiente de prueba)',
    evidencia: 'AT-06, AT-09, MC-14', owasp: 'A07 Fallas de identificación y autenticación', req: 'RF-01 / RNF-02',
  },
  {
    id: 'DEF-002', titulo: 'El servidor acepta correos con formato inválido',
    descripcion: 'POST /api/Users devuelve 201 para correos como "sinarroba", "@dominio.com" y "usuario@dominio". La validación existe solo en la interfaz.',
    severidad: 'Medio', prioridad: 'Media', estado: 'Corregido y verificado (ambiente de prueba)',
    evidencia: 'AT-10, AT-11, AT-12', owasp: 'A04 Diseño inseguro', req: 'RF-01',
  },
  {
    id: 'DEF-003', titulo: 'Inyección SQL en el login permite autenticarse como administrador',
    descripcion: "POST /rest/user/login con el correo \"' OR 1=1--\" devuelve HTTP 200 y abre sesión como admin@juice-sh.op sin conocer su contraseña.",
    severidad: 'Crítico', prioridad: 'Alta', estado: 'Abierto',
    evidencia: 'AT-19, MC-15', owasp: 'A03 Inyección', req: 'RNF-02',
  },
  {
    id: 'DEF-004', titulo: 'Control de acceso roto: un usuario lee el carrito de otro (IDOR)',
    descripcion: 'GET /rest/basket/{id} con el token del usuario B devuelve HTTP 200 con el carrito del usuario A. No se valida que el carrito pertenezca al usuario autenticado.',
    severidad: 'Alto', prioridad: 'Alta', estado: 'Abierto',
    evidencia: 'AT-15', owasp: 'A01 Pérdida de control de acceso', req: 'RF-04 / RNF-02',
  },
  {
    id: 'DEF-005', titulo: 'El servidor acepta comentarios de feedback de más de 160 caracteres',
    descripcion: 'POST /api/Feedbacks con un comentario de 161 caracteres devuelve 201. El límite de 160 solo se aplica en el campo del formulario (maxlength).',
    severidad: 'Medio', prioridad: 'Media', estado: 'Abierto',
    evidencia: 'AT-17', owasp: 'A04 Diseño inseguro', req: 'RF-05',
  },
  {
    id: 'DEF-006', titulo: 'El servidor acepta calificaciones fuera de rango (0 estrellas)',
    descripcion: 'POST /api/Feedbacks con calificación 0 devuelve 201, aunque la calificación válida es de 1 a 5.',
    severidad: 'Bajo', prioridad: 'Baja', estado: 'Abierto',
    evidencia: 'AT-18', owasp: 'A04 Diseño inseguro', req: 'RF-05',
  },
  {
    id: 'DEF-007', titulo: 'Falta la cabecera Content-Security-Policy (y HSTS)',
    descripcion: 'La respuesta de la página principal incluye X-Content-Type-Options y X-Frame-Options, pero no Content-Security-Policy ni Strict-Transport-Security, lo que amplía el impacto de cualquier XSS.',
    severidad: 'Medio', prioridad: 'Media', estado: 'Abierto',
    evidencia: 'AT-20, ZAP (CSP no definida en 5 URL)', owasp: 'A05 Configuración de seguridad incorrecta', req: 'RNF-02',
  },
  {
    id: 'DEF-008', titulo: 'XSS en el campo de búsqueda: el navegador ejecuta el script inyectado',
    descripcion: 'Al abrir /#/search?q=<iframe src="javascript:alert(\'xss\')"> se ejecuta el código en el navegador de la víctima, porque el texto de búsqueda se inserta sin sanitizar.',
    severidad: 'Alto', prioridad: 'Alta', estado: 'Abierto',
    evidencia: 'MC-16, SonarQube S6268', owasp: 'A03 Inyección', req: 'RNF-02',
  },
  {
    id: 'DEF-009', titulo: 'La sanitización de Angular está desactivada en 9 componentes',
    descripcion: 'SonarQube (regla typescript:S6268, severidad bloqueante) detecta bypassSecurityTrust* en about, administration, data-export, last-login-ip, score-board, search-result y track-result. Es la causa técnica probable de DEF-008.',
    severidad: 'Alto', prioridad: 'Alta', estado: 'Abierto',
    evidencia: 'SonarQube (9 ocurrencias)', owasp: 'A03 Inyección', req: 'RNF-02',
  },
  {
    id: 'DEF-010', titulo: 'Claves privadas y contraseña comprometida en el código fuente',
    descripcion: 'SonarQube detecta 3 claves privadas (secrets:S6706) y 1 contraseña comprometida (typescript:S6437) versionadas en el repositorio.',
    severidad: 'Alto', prioridad: 'Alta', estado: 'Abierto',
    evidencia: 'SonarQube (4 ocurrencias)', owasp: 'A02 Fallas criptográficas', req: 'RNF-02',
  },
  {
    id: 'DEF-011', titulo: 'Uso de algoritmos de hash débiles',
    descripcion: 'SonarQube (S4790) señala el uso de un algoritmo de hash débil en contextos sensibles (2 ocurrencias).',
    severidad: 'Medio', prioridad: 'Media', estado: 'Abierto',
    evidencia: 'SonarQube (2 ocurrencias)', owasp: 'A02 Fallas criptográficas', req: 'RNF-02',
  },
  {
    id: 'DEF-012', titulo: 'Uso de HTTP en claro y de generadores pseudoaleatorios no seguros',
    descripcion: 'SonarQube detecta URL http:// (S5332, 7 ocurrencias incluida infraestructura Terraform) y Math.random en contextos que podrían ser sensibles (S2245, 2).',
    severidad: 'Bajo', prioridad: 'Baja', estado: 'Abierto',
    evidencia: 'SonarQube (9 ocurrencias)', owasp: 'A02 Fallas criptográficas', req: 'RNF-02',
  },
  {
    id: 'DEF-013', titulo: 'Promesas sin manejar (posibles rechazos no capturados)',
    descripcion: 'SonarQube (typescript:S9383) reporta 34 promesas sin await/catch, 31 de ellas en el frontend. Pueden producir errores silenciosos o caídas.',
    severidad: 'Medio', prioridad: 'Media', estado: 'Abierto',
    evidencia: 'SonarQube (34 ocurrencias)', owasp: '— (fiabilidad)', req: 'RNF-04',
  },
  {
    id: 'DEF-014', titulo: 'Campos de formulario sin etiqueta asociada y tablas sin encabezados',
    descripcion: 'SonarQube (Web:InputWithoutLabelCheck ×9, Web:S5256 ×3) detecta problemas de accesibilidad: lectores de pantalla no pueden identificar los campos.',
    severidad: 'Bajo', prioridad: 'Baja', estado: 'Abierto',
    evidencia: 'SonarQube (12 ocurrencias)', owasp: '— (usabilidad)', req: 'RNF-03',
  },
  {
    id: 'DEF-015', titulo: 'Inyección SQL en la búsqueda de productos, con filtración del error interno',
    descripcion: 'OWASP ZAP detectó (riesgo alto) y se verificó a mano que GET /rest/products/search?q=\'( devuelve HTTP 500 con el mensaje "SQLITE_ERROR: near "(": syntax error": la entrada llega a la consulta SQL sin parametrizar y el error de la base de datos se muestra al cliente. ZAP reporta lo mismo en POST /rest/user/login.',
    severidad: 'Alto', prioridad: 'Alta', estado: 'Abierto',
    evidencia: 'ZAP; evidencias/zap/verificacion-manual-zap.txt', owasp: 'A03 Inyección', req: 'RNF-02',
  },
  {
    id: 'DEF-016', titulo: 'Redirección abierta: /redirect lleva a cualquier sitio externo',
    descripcion: 'OWASP ZAP detectó (alertas "External Redirect" y "Off-site Redirect") y se verificó que GET /redirect?to=https://sitio-externo.example/?https://github.com/juice-shop/juice-shop responde 302 con Location hacia el sitio externo: la validación de la lista permitida se evade incluyendo una URL permitida dentro de la cadena. Sirve para phishing con un enlace que parece del sitio legítimo. ZAP lo califica como alto; se clasifica Medio por requerir interacción de la víctima.',
    severidad: 'Medio', prioridad: 'Media', estado: 'Abierto',
    evidencia: 'ZAP; evidencias/zap/verificacion-manual-zap.txt', owasp: 'A01 Pérdida de control de acceso', req: 'RNF-02',
  },
  {
    id: 'DEF-017', titulo: 'CORS permisivo: Access-Control-Allow-Origin: *',
    descripcion: 'La página principal y los recursos estáticos responden con Access-Control-Allow-Origin: * (ZAP: Cross-Domain Misconfiguration, 5 URL), lo que permite que cualquier sitio lea respuestas de la API desde el navegador de un usuario.',
    severidad: 'Medio', prioridad: 'Media', estado: 'Abierto',
    evidencia: 'ZAP; evidencias/zap/verificacion-manual-zap.txt', owasp: 'A05 Configuración de seguridad incorrecta', req: 'RNF-02',
  },
];

// Ciclo de vida del defecto representativo DEF-001 (todas las transiciones tienen evidencia real).
export const CICLO_DEF001 = [
  ['1. Nuevo', 'Sondeo exploratorio de la API: contraseñas de 0, 1, 4, 5, 6, 39, 40, 41 y 100 caracteres; solo la de 0 se rechazó.', '15/11/2026', 'Salida del sondeo (sección 12)'],
  ['2. Confirmado', 'La suite automatizada reproduce el fallo: AT-06 (4 car.) y AT-09 (41 car.) reciben HTTP 201 en lugar de 400. Se reproduce de forma guiada en MC-14.', '15/11/2026', 'playwright-ejecucion.log; MC-14'],
  ['3. Clasificado', 'Severidad Alto (incumple RNF-02; OWASP A07), prioridad Alta: es explotable con una sola petición y habilita cuentas con contraseñas triviales.', '15/11/2026', 'Tabla de defectos'],
  ['4. En corrección', 'Se escribe un middleware que valida longitud de contraseña (5–40) y formato de correo antes de crear la cuenta en POST /api/Users.', '15/11/2026', 'pruebas/correcciones/generar-parche-DEF-001-002.mjs'],
  ['5. Resuelto', 'El parche se aplica a una instancia aislada (puerto 3200); la línea base (puerto 3100) se conserva para las evidencias.', '15/11/2026', 'Contenedor juice-shop-fix'],
  ['6. Verificado', 'Se repiten AT-06 a AT-13: 8 de 8 aprobadas (AT-07, AT-08 y AT-13 confirman que no hay regresión). Suite completa: 16 aprobadas; las 5 que siguen fallando corresponden a DEF-003 a DEF-007, aún abiertos.', '15/11/2026', 'playwright-regresion-fix.log'],
  ['7. Cierre', 'Pendiente: integrar el parche en el código fuente principal. Mientras tanto el defecto queda "Corregido y verificado (ambiente de prueba)".', '—', '—'],
];
