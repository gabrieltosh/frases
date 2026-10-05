import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIAS, RAIZ, leerFrases } from './lib.mjs';

const SITIO = path.join(RAIZ, 'site');
const DIST = path.join(RAIZ, 'dist');

const frases = leerFrases();

/**
 * La página es un único archivo (site/index.html). Se le inyectan el nombre visible
 * de cada categoría, para que entienda las claves de categorias.json
 * («conversacion» → «Conversación»), y las frases mismas: no se publica un
 * frases.json aparte.
 */
const nombres = Object.fromEntries(Object.entries(CATEGORIAS).map(([id, cat]) => [id, cat.nombre]));
// «<» escapado para que ninguna frase pueda cerrar el <script> de la página
const enScript = valor => JSON.stringify(valor).replaceAll('<', '\\u003c');

const html = fs
  .readFileSync(path.join(SITIO, 'index.html'), 'utf8')
  .replace('/*{{CATEGORIAS}}*/{}', () => enScript(nombres))
  .replace('/*{{FRASES}}*/null', () => enScript(frases));

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');

// PWA: manifest e iconos tal cual; el service worker lleva la versión de esta página,
// así el navegador lo actualiza (y renueva la caché) cada vez que cambian las frases o el sitio.
fs.copyFileSync(path.join(SITIO, 'manifest.json'), path.join(DIST, 'manifest.json'));
fs.cpSync(path.join(SITIO, 'icons'), path.join(DIST, 'icons'), { recursive: true });
const version = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);
const sw = fs.readFileSync(path.join(SITIO, 'sw.js'), 'utf8').replace('{{VERSION}}', version);
fs.writeFileSync(path.join(DIST, 'sw.js'), sw, 'utf8');

console.log(`dist/index.html · ${frases.length} frases · ${(html.length / 1024).toFixed(1)} kB`);
