import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ARCHIVO_FRASES = path.join(RAIZ, 'data', 'frases.json');

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

/** Lee data/frases.json: `{ "frases": [...] }`, más nuevas primero. */
export function leerFrases() {
  if (!fs.existsSync(ARCHIVO_FRASES)) return [];
  const datos = JSON.parse(fs.readFileSync(ARCHIVO_FRASES, 'utf8'));
  if (!Array.isArray(datos.frases)) throw new Error('data/frases.json: falta el arreglo "frases"');
  return datos.frases;
}

function escribirFrases(frases) {
  fs.mkdirSync(path.dirname(ARCHIVO_FRASES), { recursive: true });
  fs.writeFileSync(ARCHIVO_FRASES, JSON.stringify({ frases }, null, 2) + '\n', 'utf8');
}

/**
 * Agrega una frase al principio de data/frases.json y la devuelve tal como quedó.
 * Recibe el formato del parser (texto, categoria, autor, fuente, tags, fecha).
 */
export function guardarFrase(frase) {
  const frases = leerFrases();
  const categoria = resolverCategoria(frase.categoria) || 'sin-clasificar';
  const nueva = {
    id: frases.reduce((max, f) => Math.max(max, Number(f.id) || 0), 0) + 1,
    text: frase.texto.trim(),
    ...(frase.autor ? { author: frase.autor } : {}),
    ...(frase.fuente ? { source: frase.fuente } : {}),
    category: CATEGORIAS[categoria].nombre,
    tags: frase.tags || [],
    date: frase.fecha || hoyLocal(),
  };
  escribirFrases([nueva, ...frases]);
  return nueva;
}
