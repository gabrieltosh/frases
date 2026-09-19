# Frases

Colección personal de frases, párrafos y líneas sueltas que vale la pena no olvidar.
Se captura desde el celular por Telegram, se guarda como texto plano en este repo y
se publica sola como sitio estático en GitHub Pages.

```
frases/<categoría>/<fecha>-<slug>.md   una frase por archivo, texto plano
categorias.json                        las categorías y sus atajos
scripts/                               captura, sincronización y build (Node, sin dependencias)
site/                                  plantilla, estilos y JS del sitio
dist/                                  lo generado (no se versiona)
```

## Capturar desde el celular

Le mandas un mensaje al bot y ya está. El formato es libre; todo menos la frase es opcional:

```
Texto de la frase, puede ocupar varias líneas.
— Autor, Fuente
#cancion #tiempo
```

- El primer `#hashtag` que coincida con una categoría la define; los demás quedan como etiquetas.
- La línea que empieza con `—` (o `-`) es la atribución: `Autor, Fuente`.
- Sin `#categoría` la frase cae en **sin clasificar**, y la ordenas después.

Comandos del bot: `/ayuda` y `/cuantas`.

### Categorías

`reflexion` · `cancion` · `libro` · `pelicula` · `conversacion` · `propia` · `sin-clasificar`

Cada una acepta atajos (`#musica`, `#letra` y `#c` van a *canción*). Se editan en
[categorias.json](categorias.json); agregar una categoría nueva es añadir una línea ahí.

## Capturar desde la computadora

```bash
npm run nueva -- "La frase
— Autor, Fuente
#reflexion"
```

Flags opcionales que mandan sobre el texto: `--cat`, `--autor`, `--fuente`, `--tags a,b`.

## Ver el sitio localmente

```bash
npm run build && python3 -m http.server 4173 --directory dist
```

## Puesta en marcha (una sola vez)

1. **Crear el bot.** En Telegram, habla con [@BotFather](https://t.me/BotFather) → `/newbot`.
   Guarda el token que te da.
2. **Averiguar tu ID de usuario.** Habla con [@userinfobot](https://t.me/userinfobot); te
   responde un número. Sirve para que el bot ignore a cualquier otra persona que lo encuentre.
3. **Subir el repo a GitHub** (público) y cargar los dos secretos en
   *Settings → Secrets and variables → Actions*:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_USER_ID`
4. **Activar Pages** en *Settings → Pages → Source: GitHub Actions*.
5. **Permitir que Actions escriba** en *Settings → Actions → General → Workflow permissions:
   Read and write*.
6. Mándale `/ayuda` al bot y corre el workflow **Capturar desde Telegram** a mano la primera
   vez para comprobar que responde.

A partir de ahí: cada 10 minutos el workflow revisa si hay mensajes nuevos, los guarda,
hace commit y republica el sitio. El bot te contesta confirmando dónde quedó cada frase.

> El bot usa `getUpdates`, así que no debe tener un webhook configurado. Si alguna vez le
> pusiste uno: `curl https://api.telegram.org/bot<TOKEN>/deleteWebhook`.

## Editar o reclasificar

Son archivos de texto: se editan desde github.com en el celular, o en el editor de siempre.
Mover una frase de categoría es mover el archivo de carpeta y cambiar la línea `categoria:`.
El sitio se reconstruye solo con cada push.

Las cuatro frases de ejemplo en `frases/` están para que el sitio no nazca vacío: bórralas
cuando tengas las tuyas.
