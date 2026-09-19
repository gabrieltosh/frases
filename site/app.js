// El libro: una frase por hoja, el texto se escribe al llegar y las hojas giran.
// Todo el contenido ya viene en el HTML; sin JavaScript se lee como una lista.
(() => {
  const raiz = document.documentElement;
  raiz.classList.remove('sin-js');

  const libro = document.querySelector('#libro');
  const paginas = [...document.querySelectorAll('.pagina')];
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
  let activas = paginas.slice();   // las páginas que pasan el filtro, en orden
  let posicion = 0;
  let girando = false;
  let tecleo = 0;                  // token para cancelar un tecleo a medias

  /* ---------- máquina de escribir ---------- */

  function escribir(pagina) {
    const escrito = pagina.querySelector('.escrito');
    const texto = pagina.querySelector('.fantasma').textContent;
    const mio = ++tecleo;

    pagina.classList.remove('revelada');
    escrito.classList.remove('listo');

    if (quieto.matches) {
      escrito.textContent = texto;
      escrito.classList.add('listo');
      pagina.classList.add('revelada');
      return;
    }

    // Un ritmo humano: más lento en los signos, y nunca más de ~2,4 s en total.
    const letras = [...texto];
    const base = Math.min(34, Math.max(9, 2400 / letras.length));
    const tiempos = [];
    let acumulado = 0;
    for (const letra of letras) {
      acumulado += base * (letra === '\n' ? 9 : /[.!?…]/.test(letra) ? 7 : /[,;:—]/.test(letra) ? 4 : 1);
      tiempos.push(acumulado);
    }

    escrito.textContent = '';
    let arranque = null;
    let escritas = 0;

    const paso = (ahora) => {
      if (mio !== tecleo) return;
      if (arranque === null) arranque = ahora;
      const transcurrido = ahora - arranque;
      while (escritas < letras.length && tiempos[escritas] <= transcurrido) escritas++;
      escrito.textContent = letras.slice(0, escritas).join('');

      if (escritas < letras.length) {
        requestAnimationFrame(paso);
      } else {
        escrito.classList.add('listo');
        pagina.classList.add('revelada');
      }
    };

    requestAnimationFrame(paso);
  }

  /** Copia visual de una hoja: completa (como se ve) o en blanco (aún sin escribir). */
  function clonarHoja(pagina, { enBlanco } = {}) {
    const hoja = pagina.querySelector('.hoja').cloneNode(true);
    const escrito = hoja.querySelector('.escrito');
    if (enBlanco) {
      escrito.textContent = '';
      escrito.classList.add('listo');
      hoja.classList.remove('revelada');
    } else {
      escrito.textContent = hoja.querySelector('.fantasma').textContent;
      escrito.classList.add('listo');
      hoja.classList.add('revelada');
    }
    const sombra = document.createElement('div');
    sombra.className = 'sombra';
    hoja.append(sombra);
    return hoja;
  }

  /* ---------- pasar la hoja ---------- */

  function mostrar(nueva, direccion) {
    if (girando || !activas.length) return;
    const destino = Math.max(0, Math.min(activas.length - 1, nueva));
    const anterior = activas[posicion];
    const pagina = activas[destino];
    if (pagina === anterior && anterior?.classList.contains('activa')) return;

    posicion = destino;
    actualizarFolio();
    guardarEstado();

    if (!anterior || quieto.matches || !direccion) {
      paginas.forEach((p) => p.classList.remove('activa'));
      pagina.classList.add('activa');
      escribir(pagina);
      return;
    }

    girando = true;
    tecleo++; // corta el tecleo de la hoja que se va

    const volando = document.createElement('div');
    volando.className = 'volando';
    volando.style.transformOrigin = 'left center';

    const anverso = document.createElement('div');
    anverso.className = 'cara anverso';
    const reverso = document.createElement('div');
    reverso.className = 'cara reverso';

    // Al avanzar se va la hoja actual; al retroceder vuelve la anterior.
    anverso.append(clonarHoja(direccion > 0 ? anterior : pagina, { enBlanco: direccion < 0 }));
    reverso.append(clonarHoja(direccion > 0 ? pagina : anterior, { enBlanco: direccion > 0 }));
    volando.append(anverso, reverso);
    libro.append(volando);

    paginas.forEach((p) => p.classList.remove('activa'));
    pagina.classList.add('activa');
    if (direccion > 0) {
      // La hoja de abajo espera en blanco hasta que termine el giro.
      const escrito = pagina.querySelector('.escrito');
      escrito.textContent = '';
      pagina.classList.remove('revelada');
    } else {
      const escrito = pagina.querySelector('.escrito');
      escrito.textContent = pagina.querySelector('.fantasma').textContent;
      escrito.classList.add('listo');
      pagina.classList.add('revelada');
    }

    const duracion = 640;
    const suavizado = 'cubic-bezier(.42,.02,.2,1)';
    const giro = direccion > 0
      ? [{ transform: 'rotateY(0deg)', opacity: 1, offset: 0 },
         { transform: 'rotateY(-140deg)', opacity: 1, offset: .78 },
         { transform: 'rotateY(-180deg)', opacity: 0, offset: 1 }]
      : [{ transform: 'rotateY(-180deg)', opacity: 0, offset: 0 },
         { transform: 'rotateY(-140deg)', opacity: 1, offset: .22 },
         { transform: 'rotateY(0deg)', opacity: 1, offset: 1 }];

    const animacion = volando.animate(giro, { duration: duracion, easing: suavizado, fill: 'forwards' });

    // Cada cara se apaga exactamente cuando la hoja cruza el perfil (offset .5
    // con estos keyframes), para que nunca se vea el texto en espejo.
    const caras = [
      [anverso, direccion > 0 ? [1, 1, 0, 0] : [0, 0, 1, 1]],
      [reverso, direccion > 0 ? [0, 0, 1, 1] : [1, 1, 0, 0]],
    ];
    for (const [nodo, [a, b, c, d] ] of caras) {
      nodo.animate(
        [
          { opacity: a, offset: 0 },
          { opacity: b, offset: .499 },
          { opacity: c, offset: .5 },
          { opacity: d, offset: 1 },
        ],
        { duration: duracion, easing: suavizado, fill: 'forwards' }
      );
    }

    const sombras = [
      [volando.querySelector('.anverso .sombra'), direccion > 0 ? [0, .55] : [.55, 0]],
      [volando.querySelector('.reverso .sombra'), direccion > 0 ? [.5, 0] : [0, .5]],
    ];
    for (const [nodo, [de, a]] of sombras) {
      nodo.animate([{ opacity: de }, { opacity: a }], { duration: duracion, easing: suavizado });
    }

    const terminar = () => {
      volando.remove();
      girando = false;
      if (direccion > 0) escribir(pagina);
    };

    animacion.addEventListener('finish', terminar, { once: true });
    animacion.addEventListener('cancel', terminar, { once: true });
  }

  const avanzar = () => mostrar(posicion + 1, 1);
  const retroceder = () => mostrar(posicion - 1, -1);

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

  /* ---------- filtros ---------- */

  function filtrar(nuevaCategoria, { conservar = true } = {}) {
    const antes = activas[posicion];
    categoria = nuevaCategoria;
    activas = paginas.filter((p) => categoria === 'todas' || p.dataset.categoria === categoria);

    for (const pildora of pildoras) {
      pildora.setAttribute('aria-pressed', String(pildora.dataset.categoria === categoria));
    }

    sinResultados.hidden = activas.length > 0;
    if (!activas.length) {
      paginas.forEach((p) => p.classList.remove('activa'));
      posicion = 0;
      actualizarFolio();
      return;
    }

    const seguia = conservar ? activas.indexOf(antes) : -1;
    posicion = seguia >= 0 ? seguia : 0;
    mostrar(posicion, 0);
  }

  for (const pildora of pildoras) {
    pildora.addEventListener('click', () => filtrar(pildora.dataset.categoria));
  }

  /* ---------- índice ---------- */

  const abrirIndice = () => {
    indice.hidden = false;
    buscador.focus();
    buscarEnIndice();
  };

  const cerrarIndice = () => {
    indice.hidden = true;
  };

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
      const pagina = paginas.find((p) => p.dataset.id === ficha.dataset.id);
      if (!pagina) return;
      cerrarIndice();
      // Saltar desde el índice no respeta el filtro: manda la frase elegida.
      if (!activas.includes(pagina)) filtrar('todas', { conservar: false });
      const salto = activas.indexOf(pagina);
      mostrar(salto, salto === posicion ? 0 : salto > posicion ? 1 : -1);
    });
  }

  indice.addEventListener('click', (e) => {
    if (e.target === indice) cerrarIndice();
  });

  /* ---------- controles ---------- */

  botonAtras.addEventListener('click', retroceder);
  botonAdelante.addEventListener('click', avanzar);

  for (const boton of document.querySelectorAll('[data-accion]')) {
    boton.addEventListener('click', () => {
      const accion = boton.dataset.accion;
      if (accion === 'indice') abrirIndice();
      if (accion === 'cerrar-indice') cerrarIndice();
      if (accion === 'azar') alAzar();
      if (accion === 'tema') alternarTema();
    });
  }

  function alAzar() {
    if (activas.length < 2) return;
    let destino = posicion;
    while (destino === posicion) destino = Math.floor(Math.random() * activas.length);
    mostrar(destino, destino > posicion ? 1 : -1);
  }

  document.addEventListener('keydown', (e) => {
    if (!indice.hidden) {
      if (e.key === 'Escape') cerrarIndice();
      return;
    }
    if (e.target.matches('input, textarea')) return;

    const acciones = {
      ArrowRight: avanzar,
      ArrowDown: avanzar,
      PageDown: avanzar,
      ' ': avanzar,
      ArrowLeft: retroceder,
      ArrowUp: retroceder,
      PageUp: retroceder,
      Home: () => mostrar(0, -1),
      End: () => mostrar(activas.length - 1, 1),
      r: alAzar,
      i: abrirIndice,
      '/': abrirIndice,
    };

    const accion = acciones[e.key];
    if (accion) { e.preventDefault(); accion(); }
  });

  // Deslizar con el dedo, como en un libro de verdad.
  let inicioX = 0, inicioY = 0, inicioT = 0;
  libro.addEventListener('touchstart', (e) => {
    inicioX = e.changedTouches[0].clientX;
    inicioY = e.changedTouches[0].clientY;
    inicioT = Date.now();
  }, { passive: true });

  libro.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - inicioX;
    const dy = e.changedTouches[0].clientY - inicioY;
    if (Date.now() - inicioT > 700) return;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    dx < 0 ? avanzar() : retroceder();
  }, { passive: true });

  // Tocar el tercio derecho o izquierdo de la hoja también pasa página.
  libro.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    const caja = libro.getBoundingClientRect();
    const relativo = (e.clientX - caja.left) / caja.width;
    if (relativo > .72) avanzar();
    else if (relativo < .28) retroceder();
  });

  /* ---------- tema ---------- */

  function alternarTema() {
    const oscuroAhora = raiz.dataset.tema === 'oscuro' ||
      (!raiz.dataset.tema && matchMedia('(prefers-color-scheme: dark)').matches);
    const siguiente = oscuroAhora ? 'claro' : 'oscuro';
    raiz.dataset.tema = siguiente;
    try { localStorage.setItem('tema', siguiente); } catch { /* modo privado */ }
  }

  try {
    const guardado = localStorage.getItem('tema');
    if (guardado) raiz.dataset.tema = guardado;
  } catch { /* modo privado */ }

  /* ---------- arranque ---------- */

  const params = new URLSearchParams(location.search);
  const catInicial = [...pildoras].some((p) => p.dataset.categoria === params.get('cat'))
    ? params.get('cat')
    : 'todas';

  categoria = catInicial;
  activas = paginas.filter((p) => categoria === 'todas' || p.dataset.categoria === categoria);
  for (const pildora of pildoras) {
    pildora.setAttribute('aria-pressed', String(pildora.dataset.categoria === categoria));
  }

  const pedida = activas.findIndex((p) => p.dataset.id === params.get('f'));
  posicion = pedida >= 0 ? pedida : 0;
  sinResultados.hidden = activas.length > 0;
  actualizarFolio();
  if (activas.length) mostrar(posicion, 0);
})();
