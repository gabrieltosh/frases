import { resolverCategoria } from './lib.mjs';

const GUION = /^\s*(?:—|–|--|-|~|—)\s*(.+)$/;
const SOLO_HASHTAGS = /^#[\p{L}\p{N}_-]+(\s+#[\p{L}\p{N}_-]+)*$/u;
const HASHTAGS_AL_FINAL = /\s+((?:#[\p{L}\p{N}_-]+(?:\s+|$))+)$/u;

/**
 * Convierte un mensaje suelto en una frase estructurada.
 *
 *   Ojalá que las hojas no te toquen el cuerpo cuando caigan.
 *   — Silvio Rodríguez, Ojalá
 *   #cancion #tiempo
 *
 * - Los #hashtags van al final: en su propia línea o pegados al texto, da igual.
 *   El primero que coincida con una categoría manda; los demás quedan como tags.
 * - Una línea que empieza con — (o -) es la atribución: "Autor, Fuente".
 * - Si no hay categoría, cae en sin-clasificar para ordenarla después.
 */
export function parsearMensaje(mensaje) {
  const lineas = mensaje.replace(/\r/g, '').split('\n');
  const tags = [];
  let categoria = null;
  let autor = '';
  let fuente = '';

  const anotar = (bruto) => {
    const id = resolverCategoria(bruto);
    if (id && !categoria) categoria = id;
    else tags.push(bruto.replace(/^#/, ''));
  };

  // Recorre desde el final: los metadatos viven abajo.
  while (lineas.length) {
    const ultima = lineas[lineas.length - 1].trim();

    if (!ultima) { lineas.pop(); continue; }

    if (SOLO_HASHTAGS.test(ultima)) {
      for (const bruto of ultima.split(/\s+/)) anotar(bruto);
      lineas.pop();
      continue;
    }

    // Hashtags pegados al final de una línea con texto: «… y se fue. #cancion»
    const cola = ultima.match(HASHTAGS_AL_FINAL);
    if (cola) {
      for (const bruto of cola[1].trim().split(/\s+/)) anotar(bruto);
      lineas[lineas.length - 1] = ultima.slice(0, cola.index).trimEnd();
      continue;
    }

    const atribucion = ultima.match(GUION);
    if (atribucion && !autor) {
      const partes = atribucion[1].split(/\s*(?:,|—|–|\||\sen\s)\s*/);
      autor = (partes.shift() || '').trim();
      fuente = partes.join(', ').trim();
      lineas.pop();
      continue;
    }

    break;
  }

  let texto = lineas.join('\n').trim();
  texto = texto.replace(/^["“«']\s*/, '').replace(/\s*["”»']$/, '').trim();

  return {
    texto,
    categoria: categoria || 'sin-clasificar',
    clasificada: Boolean(categoria),
    autor,
    fuente,
    tags,
  };
}
