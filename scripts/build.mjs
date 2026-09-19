import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIAS, RAIZ, hoyLocal, leerFrases, normalizar } from './lib.mjs';

const SITIO = path.join(RAIZ, 'site');
const DIST = path.join(RAIZ, 'dist');

const TITULO = process.env.SITIO_TITULO || 'Frases';
const SUBTITULO =
  process.env.SITIO_SUBTITULO || 'Lo que valía la pena no olvidar.';

const escapar = (t) =>
  String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const frases = leerFrases();

const conteos = frases.reduce((acc, f) => {
  acc[f.categoria] = (acc[f.categoria] || 0) + 1;
  return acc;
}, {});

const filtros = [
  `<button class="pildora" type="button" data-categoria="todas" aria-pressed="true">Todas<span class="cuenta">${frases.length}</span></button>`,
  ...Object.entries(CATEGORIAS)
    .filter(([id]) => conteos[id])
    .map(
      ([id, cat]) =>
        `<button class="pildora" type="button" data-categoria="${id}" aria-pressed="false">${cat.emoji} ${escapar(cat.nombre)}<span class="cuenta">${conteos[id]}</span></button>`
    ),
].join('\n      ');

const fechaLarga = (iso) => {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return iso;
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${d} de ${meses[m - 1]} de ${a}`;
};

const tarjetas = frases
  .map((f) => {
    const cat = CATEGORIAS[f.categoria] || { nombre: f.categoria, emoji: '○' };

    const atribucion = f.autor || f.fuente
      ? `<p class="atribucion">— ${escapar(f.autor || '¿?')}${
          f.fuente ? ` <span class="obra">· ${escapar(f.fuente)}</span>` : ''
        }</p>`
      : '';

    const etiquetas = f.tags
      .map((t) => `<span class="separador">·</span><span class="etiqueta">#${escapar(t)}</span>`)
      .join('');

    // Todo lo buscable, ya normalizado, para que el filtro del cliente sea un indexOf.
    const heno = normalizar([f.texto, f.autor, f.fuente, cat.nombre, ...f.tags].join(' '));

    return `<article class="frase" data-categoria="${f.categoria}" data-busqueda="${escapar(heno)}">
      <blockquote>${escapar(f.texto)}</blockquote>
      ${atribucion}
      <div class="pie">
        <span class="categoria">${cat.emoji} ${escapar(cat.nombre)}</span>${etiquetas}
        <time datetime="${escapar(f.fecha)}">${fechaLarga(f.fecha)}</time>
      </div>
    </article>`;
  })
  .join('\n');

const html = fs
  .readFileSync(path.join(SITIO, 'plantilla.html'), 'utf8')
  .replaceAll('{{TITULO}}', escapar(TITULO))
  .replaceAll('{{SUBTITULO}}', escapar(SUBTITULO))
  .replaceAll('{{DESCRIPCION}}', escapar(`${SUBTITULO} ${frases.length} frases reunidas.`))
  .replace('{{FILTROS}}', filtros)
  .replace('{{FRASES}}', tarjetas || '')
  .replace('{{TOTAL}}', frases.length === 1 ? '1 frase' : `${frases.length} frases`)
  .replace('{{ACTUALIZADO}}', fechaLarga(hoyLocal()))
  .replace('{{ESTILO}}', fs.readFileSync(path.join(SITIO, 'estilo.css'), 'utf8'))
  .replace('{{APP}}', fs.readFileSync(path.join(SITIO, 'app.js'), 'utf8'));

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');
// Por si algún día quieres consumirlas desde otro lado (widget, wallpaper, bot).
fs.writeFileSync(path.join(DIST, 'frases.json'), JSON.stringify(frases, null, 2), 'utf8');

console.log(`dist/index.html · ${frases.length} frases · ${(html.length / 1024).toFixed(1)} kB`);
