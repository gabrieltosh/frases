# Frases

Colección personal de frases, párrafos y líneas sueltas que vale la pena no olvidar.
Se captura desde el celular por Telegram, se guarda como texto plano en este repo y
se publica sola como sitio estático en GitHub Pages.

El sitio se lee como un libro: una frase por hoja, la hoja se dobla como papel al
pasarla y la frase se escribe sola al aterrizar.

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
  "icono": "conversacion",
  "emoji": "❞",
  "atajos": ["v", "conversacion", "conversación", "dicho", "escuchado"]
}
```

La clave (`conversacion`) es el hashtag y también la carpeta dentro de `frases/`; `nombre` es
lo que se ve en el libro; `icono` apunta a un `<symbol id="i-…">` de [site/iconos.svg](site/iconos.svg);
`emoji` sólo lo usa el bot al responder por Telegram; `atajos` son otros hashtags que llevan
a la misma categoría. El orden del archivo es el orden de las píldoras del sitio.

Para estrenar una categoría: se añade el bloque, se dibuja su `<symbol>` en el sprite y se
hace commit. El hashtag funciona enseguida y la carpeta se crea sola con la primera frase.
Si falta el símbolo, el build avisa por consola y pone el icono genérico en su lugar.

## Capturar desde la computadora

```bash
npm run nueva -- "La frase
— Autor, Fuente
#reflexion"
```

Flags opcionales que mandan sobre el texto: `--cat`, `--autor`, `--fuente`, `--tags a,b`.

## Cómo se lee el sitio

Una frase por hoja. Se pasa de página arrastrando la esquina con el dedo o el mouse
(la hoja se curva y sigue el puntero), tocando el lado derecho o izquierdo, o con las
flechas. Al pasar el mouse por una esquina, se dobla un poco para invitar.

| Tecla | |
|---|---|
| `→` `espacio` | siguiente |
| `←` | anterior |
| `Inicio` / `Fin` | primera / última |
| `R` | una al azar |
| `I` o `/` | abrir el índice (ahí está la búsqueda) |
| `Esc` | cerrar el índice |

Las píldoras de arriba filtran por categoría; el libro se re-pagina al vuelo. La página
que estás leyendo queda en la URL, así que compartir una frase es copiar el enlace.

Todo el contenido va en el HTML: sin JavaScript el libro se convierte en una lista corrida
y se sigue leyendo entero. Con `prefers-reduced-motion` no hay giro ni tecleo.

### Retocar el aspecto

- [site/estilo.css](site/estilo.css) — colores (los tokens de `:root`), tipografías, tamaño de la hoja.
- [site/iconos.svg](site/iconos.svg) — el sprite de iconos; se referencian con `<use href="#i-…">`.
  Para estrenar una categoría, se agrega un `<symbol id="i-loquesea">` y se apunta a él
  desde `categorias.json` con `"icono": "loquesea"`.
- [site/app.js](site/app.js) — velocidad del tecleo (`base`, tope de 2,4 s) y del giro
  (`flippingTime`), sombras del papel (`maxShadowOpacity`) y esquinas (`showPageCorners`).
- [site/plantilla.html](site/plantilla.html) — la estructura de la página.

### De dónde sale cada cosa

El giro de las hojas lo hace [StPageFlip](https://github.com/Nodlik/StPageFlip) (MIT), que
va versionada en [site/vendor/](site/vendor) y se incrusta en el HTML durante el build: el
sitio es un único archivo y no depende de ningún CDN. Si por lo que sea no cargara, el libro
sigue funcionando sin el giro. Los iconos son SVG propios en el sprite, sin fuentes externas.

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

Son archivos de texto: se editan desde github.com en el celular, o en el editor de siempre.
Mover una frase de categoría es mover el archivo de carpeta y cambiar la línea `categoria:`.
El sitio se reconstruye solo con cada push.

Las cuatro frases de ejemplo en `frases/` están para que el sitio no nazca vacío: bórralas
cuando tengas las tuyas.
