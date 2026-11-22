// Utilidades de lectura de datos y de maquetación para el generador del informe.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(AQUI, '..');
export const EVID = path.join(RAIZ, 'evidencias');

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const quitaAnsi = (s) => String(s ?? '').replace(/\u001b\[[0-9;]*m/g, '');
export const leerJson = (p, defecto = null) => {
  try { return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, '')); } catch { return defecto; }
};
export const leerTxt = (p, defecto = '') => {
  try { return fs.readFileSync(p, 'utf8').replace(/^﻿/, ''); } catch { return defecto; }
};
export const existe = (p) => fs.existsSync(p);
export const url = (p) => pathToFileURL(p).href;
export const pct = (a, b, d = 1) => (b ? ((a / b) * 100).toFixed(d) : '0.0') + ' %';

/** Concordancia de número: cant(1, 'crítico') -> "1 crítico"; cant(3, 'crítico') -> "3 críticos". */
export const cant = (n, singular, pluralForm = singular + 's') => `${n} ${n === 1 ? singular : pluralForm}`;

/** Aplana los resultados de Playwright (JSON reporter) a una lista de { titulo, estado, duracion, stdout, error, adjuntos }. */
export function aplanaPlaywright(json) {
  const out = [];
  const recorre = (s) => {
    for (const sp of s.specs || []) {
      const t = sp.tests?.[0];
      const r = t?.results?.[0];
      out.push({
        titulo: sp.title,
        estado: sp.ok ? 'Aprobado' : 'Fallido',
        duracion: r?.duration ?? 0,
        stdout: (r?.stdout || []).map((o) => (o.text ?? '').trim()).filter(Boolean),
        error: quitaAnsi(r?.error?.message || ''),
        adjuntos: (r?.attachments || []).filter((a) => a.path).map((a) => a.path),
      });
    }
    for (const c of s.suites || []) recorre(c);
  };
  for (const s of json?.suites || []) recorre(s);
  return out;
}

/** Imagen incrustada como <img> con pie de figura. */
export const fig = (ruta, pie, ancho = '100%') =>
  existe(ruta)
    ? `<figure style="width:${ancho}"><img src="${url(ruta)}"><figcaption>${esc(pie)}</figcaption></figure>`
    : `<p class="aviso">[Evidencia no disponible: ${esc(path.basename(ruta))}]</p>`;

export const insignia = (estado) => {
  const cls = { Aprobado: 'ok', Fallido: 'ko', Crítico: 'crit', Alto: 'alto', Medio: 'medio', Bajo: 'bajo' }[estado] || 'neutro';
  return `<span class="badge ${cls}">${esc(estado)}</span>`;
};

export const tabla = (cabeceras, filas, clase = '') =>
  `<table class="${clase}"><thead><tr>${cabeceras.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${filas
    .map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
