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

console.log(`dist/index.html · ${frases.length} frases · ${(html.length / 1024).toFixed(1)} kB`);
