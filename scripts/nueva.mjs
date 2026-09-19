import { CATEGORIAS, guardarFrase, resolverCategoria } from './lib.mjs';
import { parsearMensaje } from './parsear.mjs';

// Mismo formato que el bot, por si la frase te llega estando en la computadora:
//   npm run nueva -- "Texto de la frase
//   — Autor, Fuente
//   #cancion"
// Flags opcionales que mandan sobre lo que diga el texto: --cat --autor --fuente --tags
const args = process.argv.slice(2);
const flags = {};
const sueltos = [];

for (let i = 0; i < args.length; i++) {
  const f = args[i].match(/^--([a-z]+)(?:=(.*))?$/);
  if (f) flags[f[1]] = f[2] ?? args[++i] ?? '';
  else sueltos.push(args[i]);
}

let mensaje = sueltos.join(' ').trim();
if (!mensaje) {
  process.stdin.setEncoding('utf8');
  mensaje = '';
  for await (const trozo of process.stdin) mensaje += trozo;
  mensaje = mensaje.trim();
}

if (!mensaje) {
  console.error('Uso: npm run nueva -- "La frase\\n— Autor, Fuente\\n#categoria"');
  console.error('Categorías: ' + Object.keys(CATEGORIAS).join(', '));
  process.exit(1);
}

const frase = parsearMensaje(mensaje);
if (flags.cat) frase.categoria = resolverCategoria(flags.cat) || frase.categoria;
if (flags.autor) frase.autor = flags.autor;
if (flags.fuente) frase.fuente = flags.fuente;
if (flags.tags) frase.tags = flags.tags.split(',').map((t) => t.trim()).filter(Boolean);

const ruta = guardarFrase(frase);
console.log(`${CATEGORIAS[frase.categoria].emoji} ${ruta}`);
