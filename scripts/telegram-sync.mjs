import fs from 'node:fs';
import path from 'node:path';
import { CATEGORIAS, RAIZ, guardarFrase, hoyLocal, leerFrases } from './lib.mjs';
import { parsearMensaje } from './parsear.mjs';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DUENO = String(process.env.TELEGRAM_USER_ID || '').trim();
const ESTADO = path.join(RAIZ, 'data', 'telegram.json');

if (!TOKEN) {
  console.error('Falta TELEGRAM_BOT_TOKEN.');
  process.exit(1);
}

const api = async (metodo, cuerpo) => {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${metodo}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(cuerpo ?? {}),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${metodo}: ${json.description}`);
  return json.result;
};

const responder = (chat, texto) =>
  api('sendMessage', { chat_id: chat, text: texto, disable_notification: true }).catch(
    (e) => console.error('  no se pudo responder:', e.message)
  );

const AYUDA = [
  'Mándame una frase y la guardo en el repo.',
  '',
  'Formato (todo opcional menos la frase):',
  '  Texto de la frase',
  '  — Autor, Fuente',
  '  #categoria #tag',
  '',
  'Categorías: ' + Object.keys(CATEGORIAS).filter((c) => c !== 'sin-clasificar').join(', '),
  'Sin #categoría va a «sin clasificar» y la ordenas después desde el sitio.',
].join('\n');

const estado = fs.existsSync(ESTADO)
  ? JSON.parse(fs.readFileSync(ESTADO, 'utf8'))
  : { offset: 0 };

const updates = await api('getUpdates', {
  offset: estado.offset,
  timeout: 0,
  allowed_updates: ['message'],
});

let guardadas = 0;

for (const update of updates) {
  estado.offset = update.update_id + 1;
  const msg = update.message;
  const texto = msg?.text || msg?.caption;
  if (!texto) continue;

  // El bot es de un solo dueño: cualquier otro chat se ignora en silencio.
  if (DUENO && String(msg.from?.id) !== DUENO) {
    console.log(`Ignorado mensaje de ${msg.from?.id} (${msg.from?.username || 'sin usuario'})`);
    continue;
  }

  if (/^\/(start|ayuda|help)/.test(texto)) {
    await responder(msg.chat.id, AYUDA);
    continue;
  }

  if (/^\/(cuantas|stats)/.test(texto)) {
    const todas = leerFrases();
    const porCat = Object.entries(
      todas.reduce((acc, f) => ({ ...acc, [f.categoria]: (acc[f.categoria] || 0) + 1 }), {})
    ).map(([c, n]) => `  ${CATEGORIAS[c]?.nombre || c}: ${n}`);
    await responder(msg.chat.id, `${todas.length} frases\n${porCat.join('\n')}`);
    continue;
  }

  const frase = parsearMensaje(texto);
  if (!frase.texto) {
    await responder(msg.chat.id, 'Ese mensaje venía sin texto que guardar.');
    continue;
  }

  const ruta = guardarFrase({
    ...frase,
    fecha: hoyLocal(new Date(msg.date * 1000)),
  });
  guardadas++;
  console.log(`+ ${ruta}`);

  const cat = CATEGORIAS[frase.categoria];
  await responder(
    msg.chat.id,
    frase.clasificada
      ? `${cat.emoji} Guardada en ${cat.nombre}.`
      : '○ Guardada sin clasificar. Ponle #categoría la próxima y va directo.'
  );
}

fs.mkdirSync(path.dirname(ESTADO), { recursive: true });
fs.writeFileSync(ESTADO, JSON.stringify(estado, null, 2) + '\n', 'utf8');

console.log(`${guardadas} frase(s) nueva(s); offset ${estado.offset}`);
// Le dice al workflow si hay algo que commitear.
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `guardadas=${guardadas}\n`);
}
