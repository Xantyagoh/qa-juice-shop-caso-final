// Genera server.patched.js a partir del build/server.js original de la imagen bkimminich/juice-shop.
// Corrección de DEF-001 (longitud de contraseña) y DEF-002 (formato de correo) en POST /api/Users.
// Uso: node generar-parche-DEF-001-002.mjs <server.js original> <server.patched.js salida>
import fs from 'node:fs';

const [, , entrada, salida] = process.argv;
const original = fs.readFileSync(entrada, 'utf8');
const marcador = '    /* User registration challenge verifications before finale takes over */';
if (!original.includes(marcador)) throw new Error('No se encontró el punto de inserción en server.js');

const parche = `    /* FIX DEF-001 / DEF-002: validación en el servidor de la longitud de contraseña (5-40) y del formato de correo */
    app.post('/api/Users', (req, res, next) => {
        const body = req.body ?? {};
        const pwd = typeof body.password === 'string' ? body.password.trim() : null;
        if (pwd === null || pwd.length < 5 || pwd.length > 40) {
            return res.status(400).json({ status: 'error', message: 'Password must be 5-40 characters long.' });
        }
        const mail = typeof body.email === 'string' ? body.email.trim() : '';
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(mail)) {
            return res.status(400).json({ status: 'error', message: 'Email address is not valid.' });
        }
        next();
    });
`;
fs.writeFileSync(salida, original.replace(marcador, parche + marcador), 'utf8');
console.log('Parche generado en', salida);
