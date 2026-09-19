// El libro: una frase por hoja. El giro lo hace StPageFlip (papel real, con
// esquina que se dobla y arrastre); el texto se escribe al aterrizar la hoja.
(() => {
  const raiz = document.documentElement;
  raiz.classList.remove('sin-js');

  const libro = document.querySelector('#libro');
  const todas = [...libro.querySelectorAll('.pagina')];
  const pildoras = [...document.querySelectorAll('.pildora')];
  const fichas = [...document.querySelectorAll('.ficha')];
  const botonAtras = document.querySelector('.pasar.atras');
  const botonAdelante = document.querySelector('.pasar.adelante');
  const folioActual = document.querySelector('.folio-actual');
  const folioTotal = document.querySelector('.folio-total');
  const sinResultados = document.querySelector('.sin-resultados');
  const indice = document.querySelector('.indice');
  const buscador = document.querySelector('#buscar');
  const indiceVacio = document.querySelector('.indice-vacio');

  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  let categoria = 'todas';
  let activas = todas.slice();
  let posicion = 0;
  let flip = null;
  let tecleo = 0;

  /* ---------- máquina de escribir ---------- */

  function vaciar(pagina) {
    const escrito = pagina.querySelector('.escrito');
    escrito.textContent = '';
    escrito.classList.remove('listo');
    pagina.classList.remove('revelada');
  }

  function completar(pagina) {
    const escrito = pagina.querySelector('.escrito');
    escrito.textContent = pagina.querySelector('.fantasma').textContent;
    escrito.classList.add('listo');
    pagina.classList.add('revelada');
  }

  function escribir(pagina) {
    const escrito = pagina.querySelector('.escrito');
    const texto = pagina.querySelector('.fantasma').textContent;
    const mio = ++tecleo;

    if (quieto.matches) { completar(pagina); return; }

    // Un ritmo humano: más lento en los signos, y nunca más de ~2,4 s en total.
    const letras = [...texto];
    const base = Math.min(34, Math.max(9, 2400 / letras.length));
    const tiempos = [];
    let acumulado = 0;
    for (const letra of letras) {
      acumulado += base * (letra === '\n' ? 9 : /[.!?…]/.test(letra) ? 7 : /[,;:—]/.test(letra) ? 4 : 1);
      tiempos.push(acumulado);
    }

    vaciar(pagina);
    let arranque = null;
    let escritas = 0;

    const paso = (ahora) => {
      if (mio !== tecleo) return;
      if (arranque === null) arranque = ahora;
      const transcurrido = ahora - arranque;
      while (escritas < letras.length && tiempos[escritas] <= transcurrido) escritas++;
      escrito.textContent = letras.slice(0, escritas).join('');

      if (escritas < letras.length) requestAnimationFrame(paso);
      else { escrito.classList.add('listo'); pagina.classList.add('revelada'); }
    };

    requestAnimationFrame(paso);
  }

  /** Al asentarse una hoja: las demás quedan en blanco, ésta se escribe. */
  function alLlegar() {
    tecleo++;
    const actual = activas[posicion];
    for (const pagina of todas) if (pagina !== actual) vaciar(pagina);
    if (actual) escribir(actual);
    actualizarFolio();
    guardarEstado();
  }

  function actualizarFolio() {
    folioActual.textContent = activas.length ? posicion + 1 : 0;
    folioTotal.textContent = activas.length;
    botonAtras.disabled = posicion <= 0;
    botonAdelante.disabled = posicion >= activas.length - 1;
  }

  function guardarEstado() {
    try {
      const url = new URL(location.href);
      categoria === 'todas' ? url.searchParams.delete('cat') : url.searchParams.set('cat', categoria);
      const id = activas[posicion]?.dataset.id;
      id ? url.searchParams.set('f', id) : url.searchParams.delete('f');
      history.replaceState(null, '', url);
    } catch { /* sin barra de direcciones que actualizar */ }
  }

  /* ---------- el libro ---------- */

  const hayLibreria = typeof window.St?.PageFlip === 'function';

  function crearLibro(inicial) {
    flip = new window.St.PageFlip(libro, {
      // width/height sólo fijan la proporción de la hoja; el tamaño real se estira.
      width: 420,
      height: 560,
      size: 'stretch',
      // Un minWidth enorme mantiene el libro siempre en una sola hoja a la vista.
      minWidth: 100000,
      maxWidth: 620,
      minHeight: 240,
      maxHeight: 1400,
      usePortrait: true,
      autoSize: false,
      startPage: inicial,
      flippingTime: quieto.matches ? 1 : 900,
      drawShadow: true,
      maxShadowOpacity: .28,
      showCover: false,
      showPageCorners: true,
      disableFlipByClick: false,
      clickEventForward: true,
      mobileScrollSupport: false,
      swipeDistance: 22,
    });

    flip.loadFromHTML(activas);
    flip.on('flip', (e) => { posicion = Number(e.data) || 0; alLlegar(); });
  }

  function irA(destino, { animado = true } = {}) {
    const n = Math.max(0, Math.min(activas.length - 1, destino));
    if (!activas.length) return;
    if (n === posicion) return;

    if (!flip) { posicion = n; pintarSinLibreria(); return; }
    if (animado && !quieto.matches) flip.flip(n);
    else { flip.turnToPage(n); posicion = n; alLlegar(); }
  }

  const avanzar = () => (flip && !quieto.matches ? flip.flipNext() : irA(posicion + 1, { animado: false }));
  const retroceder = () => (flip && !quieto.matches ? flip.flipPrev() : irA(posicion - 1, { animado: false }));

  /** Reserva: sin la librería el libro se reduce a una hoja que cambia. */
  function pintarSinLibreria() {
    for (const pagina of todas) pagina.hidden = pagina !== activas[posicion];
    alLlegar();
  }

  /* ---------- filtros ---------- */

  function filtrar(nuevaCategoria) {
    const antes = activas[posicion];
    categoria = nuevaCategoria;
    activas = todas.filter((p) => categoria === 'todas' || p.dataset.categoria === categoria);

    for (const pildora of pildoras) {
      pildora.setAttribute('aria-pressed', String(pildora.dataset.categoria === categoria));
    }

    sinResultados.hidden = activas.length > 0;
    libro.hidden = activas.length === 0;
    if (!activas.length) { posicion = 0; actualizarFolio(); return; }

    // turnToPage dispara 'flip', que reescribe `posicion`: el destino se guarda aparte.
    const destino = Math.max(0, activas.indexOf(antes));

    if (!flip) { posicion = destino; pintarSinLibreria(); return; }

    // updateFromHtml conserva el índice anterior, así que se recoloca a mano.
    flip.turnToPage(0);
    flip.updateFromHtml(activas);
    flip.turnToPage(destino);
    posicion = destino;
    alLlegar();
  }

  for (const pildora of pildoras) {
    pildora.addEventListener('click', () => filtrar(pildora.dataset.categoria));
  }

  /* ---------- índice ---------- */

  const abrirIndice = () => { indice.hidden = false; buscador.focus(); buscarEnIndice(); };
  const cerrarIndice = () => { indice.hidden = true; };

  function buscarEnIndice() {
    const consulta = normalizar(buscador.value.trim());
    const terminos = consulta ? consulta.split(/\s+/) : [];
    let visibles = 0;
    for (const ficha of fichas) {
      const coincide = terminos.every((t) => ficha.dataset.busqueda.includes(t));
      ficha.hidden = !coincide;
      if (coincide) visibles++;
    }
    indiceVacio.hidden = visibles > 0;
  }

  buscador.addEventListener('input', buscarEnIndice);

  for (const ficha of fichas) {
    ficha.addEventListener('click', () => {
      const pagina = todas.find((p) => p.dataset.id === ficha.dataset.id);
      if (!pagina) return;
      cerrarIndice();
      // Saltar desde el índice manda sobre el filtro: si no está a la vista, se abre.
      if (!activas.includes(pagina)) filtrar('todas');
      irA(activas.indexOf(pagina));
    });
  }

  indice.addEventListener('click', (e) => { if (e.target === indice) cerrarIndice(); });

  /* ---------- controles ---------- */

  botonAtras.addEventListener('click', retroceder);
  botonAdelante.addEventListener('click', avanzar);

  function alAzar() {
    if (activas.length < 2) return;
    let destino = posicion;
    while (destino === posicion) destino = Math.floor(Math.random() * activas.length);
    irA(destino);
  }

  function alternarTema() {
    const oscuroAhora = raiz.dataset.tema === 'oscuro' ||
      (!raiz.dataset.tema && matchMedia('(prefers-color-scheme: dark)').matches);
    const siguiente = oscuroAhora ? 'claro' : 'oscuro';
    raiz.dataset.tema = siguiente;
    try { localStorage.setItem('tema', siguiente); } catch { /* modo privado */ }
  }

  for (const boton of document.querySelectorAll('[data-accion]')) {
    boton.addEventListener('click', () => ({
      indice: abrirIndice,
      'cerrar-indice': cerrarIndice,
      azar: alAzar,
      tema: alternarTema,
    })[boton.dataset.accion]?.());
  }

  document.addEventListener('keydown', (e) => {
    if (!indice.hidden) { if (e.key === 'Escape') cerrarIndice(); return; }
    if (e.target.matches('input, textarea')) return;

    const acciones = {
      ArrowRight: avanzar, ArrowDown: avanzar, PageDown: avanzar, ' ': avanzar,
      ArrowLeft: retroceder, ArrowUp: retroceder, PageUp: retroceder,
      Home: () => irA(0), End: () => irA(activas.length - 1),
      r: alAzar, i: abrirIndice, '/': abrirIndice,
    };

    const accion = acciones[e.key];
    if (accion) { e.preventDefault(); accion(); }
  });

  try {
    const guardado = localStorage.getItem('tema');
    if (guardado) raiz.dataset.tema = guardado;
  } catch { /* modo privado */ }

  /* ---------- arranque ---------- */

  const params = new URLSearchParams(location.search);
  const catInicial = pildoras.some((p) => p.dataset.categoria === params.get('cat'))
    ? params.get('cat')
    : 'todas';

  categoria = catInicial;
  activas = todas.filter((p) => categoria === 'todas' || p.dataset.categoria === categoria);
  for (const pildora of pildoras) {
    pildora.setAttribute('aria-pressed', String(pildora.dataset.categoria === categoria));
  }

  const pedida = activas.findIndex((p) => p.dataset.id === params.get('f'));
  posicion = pedida >= 0 ? pedida : 0;
  sinResultados.hidden = activas.length > 0;

  for (const pagina of todas) vaciar(pagina);

  if (hayLibreria && activas.length) {
    crearLibro(posicion);
    alLlegar();
  } else {
    raiz.classList.add('sin-libreria');
    pintarSinLibreria();
  }
})();
