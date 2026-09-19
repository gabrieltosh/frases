import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR_FRASES = path.join(RAIZ, 'frases');

export const CATEGORIAS = JSON.parse(
  fs.readFileSync(path.join(RAIZ, 'categorias.json'), 'utf8')
);

/** Resuelve "#cancion", "cancion", "c" o "música" al id de categoría, o null. */
export function resolverCategoria(entrada) {
  if (!entrada) return null;
  const clave = normalizar(entrada.replace(/^#/, ''));
  for (const [id, cat] of Object.entries(CATEGORIAS)) {
    if (clave === id) return id;
    if (cat.atajos.some((a) => normalizar(a) === clave)) return id;
  }
  return null;
}

export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Fecha en la zona local del reloj que corre el script (ver TZ en los workflows). */
export function hoyLocal(fecha = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

export function slug(texto, largo = 48) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, largo) || 'frase';
}

/** Frontmatter mínimo: sólo claves escalares y listas en línea. Sin dependencias. */
export function parsearFrontmatter(contenido) {
  const m = contenido.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { datos: {}, cuerpo: contenido.trim() };
  const datos = {};
  for (const linea of m[1].split(/\r?\n/)) {
    const par = linea.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!par) continue;
    let valor = par[2].trim();
    if (valor.startsWith('[') && valor.endsWith(']')) {
      valor = valor
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      valor = valor.replace(/^["']|["']$/g, '');
    }
    datos[par[1]] = valor;
  }
  return { datos, cuerpo: m[2].trim() };
}

function escaparYaml(valor) {
  return /[:#"'\n]|^\s|\s$/.test(valor) ? JSON.stringify(valor) : valor;
}

export function serializar({ categoria, autor, fuente, fecha, tags = [], texto }) {
  const lineas = ['---', `categoria: ${categoria}`];
  if (autor) lineas.push(`autor: ${escaparYaml(autor)}`);
  if (fuente) lineas.push(`fuente: ${escaparYaml(fuente)}`);
  lineas.push(`fecha: ${fecha}`);
  lineas.push(`tags: [${tags.map((t) => escaparYaml(t)).join(', ')}]`);
  lineas.push('---', '', texto.trim(), '');
  return lineas.join('\n');
}

/** Lee todas las frases del repo, ordenadas de más nueva a más vieja. */
export function leerFrases() {
  const frases = [];
  if (!fs.existsSync(DIR_FRASES)) return frases;
  for (const categoria of fs.readdirSync(DIR_FRASES)) {
    const dir = path.join(DIR_FRASES, categoria);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const archivo of fs.readdirSync(dir)) {
      if (!archivo.endsWith('.md')) continue;
      const ruta = path.join(dir, archivo);
      const { datos, cuerpo } = parsearFrontmatter(fs.readFileSync(ruta, 'utf8'));
      if (!cuerpo) continue;
      frases.push({
        id: `${categoria}/${archivo.replace(/\.md$/, '')}`,
        texto: cuerpo,
        categoria: resolverCategoria(datos.categoria) || categoria,
        autor: datos.autor || '',
        fuente: datos.fuente || '',
        fecha: datos.fecha || archivo.slice(0, 10),
        tags: Array.isArray(datos.tags) ? datos.tags : datos.tags ? [datos.tags] : [],
      });
    }
  }
  return frases.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : a.id < b.id ? 1 : -1));
}

/** Escribe una frase nueva en disco y devuelve su ruta relativa. */
export function guardarFrase(frase) {
  const categoria = resolverCategoria(frase.categoria) || 'sin-clasificar';
  const fecha = frase.fecha || hoyLocal();
  const dir = path.join(DIR_FRASES, categoria);
  fs.mkdirSync(dir, { recursive: true });

  const base = `${fecha}-${slug(frase.texto)}`;
  let archivo = `${base}.md`;
  let n = 2;
  while (fs.existsSync(path.join(dir, archivo))) archivo = `${base}-${n++}.md`;

  fs.writeFileSync(
    path.join(dir, archivo),
    serializar({ ...frase, categoria, fecha }),
    'utf8'
  );
  return path.relative(RAIZ, path.join(dir, archivo));
}
