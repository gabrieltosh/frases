import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIAS, RAIZ, hoyLocal, leerFrases, normalizar } from './lib.mjs';

const SITIO = path.join(RAIZ, 'site');
const DIST = path.join(RAIZ, 'dist');

const TITULO = process.env.SITIO_TITULO || 'Frases';
const SUBTITULO = process.env.SITIO_SUBTITULO || 'Lo que valía la pena no olvidar.';

const escapar = (t) =>
  String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const fechaLarga = (iso) => {
  const [a, m, d] = String(iso).split('-').map(Number);
  return a && m && d ? `${d} de ${meses[m - 1]} de ${a}` : iso;
};

/** El tamaño de letra de la hoja depende de cuánto texto haya que meter en ella. */
const largoDe = (texto) => (texto.length < 90 ? 'corta' : texto.length > 320 ? 'larga' : 'media');

const frases = leerFrases();

const conteos = frases.reduce((acc, f) => ({ ...acc, [f.categoria]: (acc[f.categoria] || 0) + 1 }), {});

const heno = (f, cat) => normalizar([f.texto, f.autor, f.fuente, cat.nombre, ...f.tags].join(' '));

const filtros = [
  `<button class="pildora" type="button" data-categoria="todas" aria-pressed="true">Todas<span class="cuenta">${frases.length}</span></button>`,
  ...Object.entries(CATEGORIAS)
    .filter(([id]) => conteos[id])
    .map(([id, cat]) =>
      `<button class="pildora" type="button" data-categoria="${id}" aria-pressed="false">${cat.emoji} ${escapar(cat.nombre)}<span class="cuenta">${conteos[id]}</span></button>`),
].join('\n  ');

const paginas = frases
  .map((f) => {
    const cat = CATEGORIAS[f.categoria] || { nombre: f.categoria, emoji: '○' };

    const atribucion = f.autor || f.fuente
      ? `<p class="atribucion">— ${escapar(f.autor || '¿?')}${f.fuente ? ` <span class="obra">· ${escapar(f.fuente)}</span>` : ''}</p>`
      : '<p class="atribucion"></p>';

    const etiquetas = f.tags.map((t) => `<span class="etiqueta">#${escapar(t)}</span>`).join('');

    return `<article class="pagina" data-id="${escapar(f.id)}" data-categoria="${f.categoria}" data-largo="${largoDe(f.texto)}">
    <div class="hoja">
      <p class="rotulo">${cat.emoji} ${escapar(cat.nombre)}</p>
      <blockquote class="cita"><span class="fantasma" aria-hidden="true">${escapar(f.texto)}</span><span class="escrito"></span></blockquote>
      ${atribucion}
      <div class="pie">${etiquetas}<time datetime="${escapar(f.fecha)}">${fechaLarga(f.fecha)}</time></div>
    </div>
  </article>`;
  })
  .join('\n  ');

const indice = frases
  .map((f) => {
    const cat = CATEGORIAS[f.categoria] || { nombre: f.categoria, emoji: '○' };
    const firma = [f.autor, f.fuente].filter(Boolean).join(' · ');
    return `<button class="ficha" type="button" data-id="${escapar(f.id)}" data-busqueda="${escapar(heno(f, cat))}">
      <q>${escapar(f.texto)}</q>
      <span class="meta"><span class="categoria">${cat.emoji} ${escapar(cat.nombre)}</span>${firma ? ' · ' + escapar(firma) : ''}</span>
    </button>`;
  })
  .join('\n    ');

const html = fs
  .readFileSync(path.join(SITIO, 'plantilla.html'), 'utf8')
  .replaceAll('{{TITULO}}', escapar(TITULO))
  .replaceAll('{{DESCRIPCION}}', escapar(`${SUBTITULO} ${frases.length} frases reunidas.`))
  .replace('{{FILTROS}}', filtros)
  .replace('{{PAGINAS}}', paginas)
  .replace('{{INDICE}}', indice)
  .replaceAll('{{TOTAL}}', String(frases.length))
  .replace('{{TOTALTEXTO}}', frases.length === 1 ? '1 frase' : `${frases.length} frases`)
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
