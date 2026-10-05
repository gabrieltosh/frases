import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIAS, RAIZ, leerFrases } from './lib.mjs';

const SITIO = path.join(RAIZ, 'site');
const DIST = path.join(RAIZ, 'dist');

const frases = leerFrases();

/**
 * La página es un único archivo (site/index.html) que carga las frases por fetch.
 * Lo único que se le inyecta es el nombre visible de cada categoría, para que
 * entienda las claves de categorias.json («conversacion» → «Conversación»).
 */
const nombres = Object.fromEntries(Object.entries(CATEGORIAS).map(([id, cat]) => [id, cat.nombre]));
const json = JSON.stringify(nombres).replaceAll('<', '\\u003c');

const html = fs
  .readFileSync(path.join(SITIO, 'index.html'), 'utf8')
  .replace('/*{{CATEGORIAS}}*/{}', () => json);

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');
// Respaldo de la página cuando el servidor remoto no responde, y para quien quiera
// consumirlas desde otro lado (widget, wallpaper, bot).
fs.writeFileSync(path.join(DIST, 'frases.json'), JSON.stringify(frases, null, 2), 'utf8');

console.log(`dist/index.html · ${frases.length} frases · ${(html.length / 1024).toFixed(1)} kB`);
