import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIAS, RAIZ, leerFrases } from './lib.mjs';

const SITIO = path.join(RAIZ, 'site');
const DIST = path.join(RAIZ, 'dist');

// leerFrases valida que data/frases.json sea JSON y tenga el arreglo "frases":
// si alguien lo rompe editándolo a mano, el build falla en vez de publicar un sitio vacío.
const frases = leerFrases();

/**
 * La página es un único archivo (site/index.html) que pide frases.json al abrirse.
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
fs.copyFileSync(path.join(RAIZ, 'data', 'frases.json'), path.join(DIST, 'frases.json'));
// imágenes y videos de fondo: las rutas "media/..." del JSON se resuelven contra él
const MEDIA = path.join(RAIZ, 'data', 'media');
if (fs.existsSync(MEDIA)) fs.cpSync(MEDIA, path.join(DIST, 'media'), { recursive: true });

// PWA: manifest e iconos tal cual; el service worker lleva la versión de esta página,
// así el navegador lo actualiza (y renueva la caché) cada vez que cambian las frases o el sitio.
fs.copyFileSync(path.join(SITIO, 'manifest.json'), path.join(DIST, 'manifest.json'));
fs.cpSync(path.join(SITIO, 'icons'), path.join(DIST, 'icons'), { recursive: true });
const version = crypto.createHash('sha256').update(html).digest('hex').slice(0, 12);
const sw = fs.readFileSync(path.join(SITIO, 'sw.js'), 'utf8').replace('{{VERSION}}', version);
fs.writeFileSync(path.join(DIST, 'sw.js'), sw, 'utf8');

console.log(`dist/index.html · ${frases.length} frases · ${(html.length / 1024).toFixed(1)} kB`);
