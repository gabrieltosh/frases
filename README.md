# Frases

Colección personal de frases, párrafos y líneas sueltas que vale la pena no olvidar.
Se captura desde el celular por Telegram, se guarda en un solo JSON en este repo y
se publica sola como sitio estático en GitHub Pages.

El sitio es inmersivo: una frase por pantalla sobre un fondo de humo animado (WebGL)
cuyos colores, movimiento y partículas cambian según la categoría.

```
data/frases.json                       todas las frases, la única fuente
data/media/                            imágenes y videos de fondo (opcional)
categorias.json                        las categorías y sus atajos
scripts/                               captura, sincronización y build (Node, sin dependencias)
site/index.html                        la página entera: estilos, JS y shader en un solo archivo
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
  Da igual si van en su propia línea o pegados al final del texto: `Una frase cualquiera. #cancion`.
- La línea que empieza con `—` (o `-`) es la atribución: `Autor, Fuente`.
- Sin `#categoría` la frase cae en **sin clasificar**, y la ordenas después.

Comandos del bot: `/ayuda`, `/cuantas` (el recuento) y `/id` (tu número de usuario,
el que va en el secreto `TELEGRAM_USER_ID`).

### Categorías

`reflexion` · `cancion` · `libro` · `pelicula` · `conversacion` · `propia` · `sin-clasificar`

Cada una acepta atajos (`#musica`, `#letra` y `#c` van a *canción*). Todas se definen en
[categorias.json](categorias.json):

```json
"conversacion": {
  "nombre": "Conversación",
  "emoji": "❞",
  "atajos": ["v", "conversacion", "conversación", "dicho", "escuchado"]
}
```

La clave (`conversacion`) es el hashtag; `nombre` es lo que va en `category` dentro del JSON y
se ve en el sitio; `emoji` sólo lo usa el bot al responder por Telegram; `atajos` son
otros hashtags que llevan a la misma categoría.

Para estrenar una categoría: se añade el bloque y se hace commit. El hashtag funciona enseguida. En el sitio recibe una paleta generada a partir
de su nombre; para darle una propia, se agrega su `nombre` a `PAL` en [site/index.html](site/index.html).

## Capturar desde la computadora

```bash
npm run nueva -- "La frase
— Autor, Fuente
#reflexion"
```

Flags opcionales que mandan sobre el texto: `--cat`, `--autor`, `--fuente`, `--tags a,b`.

## Cómo se lee el sitio

Una frase por pantalla. Se pasa deslizando con el dedo, con la rueda del mouse, con las
flechas o con los botones de abajo a la derecha. Cada clic lanza una onda sobre el humo.

| Tecla | |
|---|---|
| `→` `↓` `espacio` | siguiente |
| `←` `↑` | anterior |
| `Inicio` / `Fin` | primera / última |
| `R` | una al azar |
| `I` o `M` | abrir el menú (categorías, índice, compartir, reproducción automática) |
| `Esc` | cerrar el menú |

Con «Todas» el orden es aleatorio; al elegir una categoría o una `#etiqueta` se recorren en
orden. La frase que estás leyendo queda en la URL, así que compartirla es copiar el enlace.
El interruptor «Animación» del menú (o `prefers-reduced-motion`) apaga el movimiento.

### De dónde salen las frases

De [data/frases.json](data/frases.json). El build lo copia junto a la página y ésta lo pide
(`frases.json`) cada vez que se abre; si no responde, muestra las frases de ejemplo incluidas
en la página. El formato:

```json
{
  "frases": [
    {
      "id": 2,
      "text": "No es que tengamos poco tiempo, sino que perdemos mucho.",
      "author": "Séneca",
      "source": "Sobre la brevedad de la vida",
      "category": "Reflexión",
      "tags": ["tiempo"],
      "date": "2026-09-18",
      "img": "media/seneca.jpg"
    }
  ]
}
```

Sólo `text` es obligatorio. `category` acepta el nombre (`Reflexión`) o la clave (`reflexion`);
`img` y `video` son el fondo de la escena y sus rutas se resuelven contra el JSON, así que
`media/seneca.jpg` es `data/media/seneca.jpg` en el repo. Las más nuevas van primero y, al
filtrar por categoría o etiqueta, se recorren en ese orden. Si el JSON queda mal escrito, el
build falla y el sitio sigue mostrando la versión anterior.

### Como app (PWA)

El sitio se instala como app: en Android/Chrome, desde el menú (**Instalar la app**) o el aviso del
navegador; en iPhone, desde Safari con *Compartir → Agregar a inicio*. Abre a pantalla completa y
funciona sin conexión con las frases de la última visita.

```
site/manifest.json   nombre, colores e iconos de la app
site/sw.js           service worker: la página por red primero y, sin conexión, la última copia
site/icons/          iconos (icon.svg es el diseño; los PNG y el .ico salen de él)
```

El build copia todo a `dist/` y le pone a `sw.js` una versión calculada de la página, así que
cada cambio de frases o del sitio actualiza la app sola.

### Retocar el aspecto

Todo está en [site/index.html](site/index.html): los colores y el clima de cada categoría
en `PAL`, el shader del humo en `FS`, y las tipografías y tamaños en el `<style>`.

## Ver el sitio localmente

```bash
npm run serve
```

## Puesta en marcha (una sola vez)

1. **Crear el bot.** En Telegram, habla con [@BotFather](https://t.me/BotFather) → `/newbot`.
   Guarda el token que te da.
2. **Averiguar tu ID de usuario.** Mándale `/id` al propio bot: te responde con tu número.
   Sirve para que ignore a cualquier otra persona que lo encuentre. (Mientras el secreto
   esté vacío el bot atiende a cualquiera, así que conviene no dejarlo para mañana.)
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

Todo está en [data/frases.json](data/frases.json): se edita desde github.com en el celular, o en
el editor de siempre. Reclasificar es cambiar `category`; borrar, quitar el bloque. El bot y
`npm run nueva` agregan arriba con el siguiente `id`. El sitio se reconstruye solo con cada push.

Las frases de ejemplo están para que el sitio no nazca vacío: bórralas cuando tengas las tuyas.
