// La lista ya viene renderizada desde el build: esto sólo filtra lo que existe,
// así que sin JavaScript el sitio se sigue leyendo entero.
(() => {
  const raiz = document.documentElement;
  const lista = document.querySelector('.lista');
  const tarjetas = [...document.querySelectorAll('.frase')];
  const buscador = document.querySelector('#buscar');
  const vacio = document.querySelector('.vacio');
  const pildoras = [...document.querySelectorAll('.pildora')];

  let categoria = 'todas';

  const normalizar = (t) =>
    t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function aplicar() {
    const consulta = normalizar(buscador.value.trim());
    const terminos = consulta ? consulta.split(/\s+/) : [];
    let visibles = 0;

    for (const tarjeta of tarjetas) {
      const coincideCat = categoria === 'todas' || tarjeta.dataset.categoria === categoria;
      const heno = tarjeta.dataset.busqueda;
      const coincideTexto = terminos.every((t) => heno.includes(t));
      const mostrar = coincideCat && coincideTexto;
      tarjeta.hidden = !mostrar;
      if (mostrar) visibles++;
    }

    vacio.hidden = visibles > 0;
    guardarEstado();
  }

  function guardarEstado() {
    // En file:// o en un sandbox esto puede lanzar; el filtro ya se aplicó igual.
    try {
      const url = new URL(location.href);
      categoria === 'todas' ? url.searchParams.delete('cat') : url.searchParams.set('cat', categoria);
      buscador.value.trim() ? url.searchParams.set('q', buscador.value.trim()) : url.searchParams.delete('q');
      history.replaceState(null, '', url);
    } catch { /* sin barra de direcciones que actualizar */ }
  }

  for (const pildora of pildoras) {
    pildora.addEventListener('click', () => {
      categoria = pildora.dataset.categoria;
      for (const otra of pildoras) {
        otra.setAttribute('aria-pressed', String(otra === pildora));
      }
      aplicar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  buscador.addEventListener('input', aplicar);

  // Una frase al azar entre las que estén pasando el filtro actual.
  document.querySelector('.azar')?.addEventListener('click', () => {
    const candidatas = tarjetas.filter((t) => !t.hidden);
    if (!candidatas.length) return;
    const elegida = candidatas[Math.floor(Math.random() * candidatas.length)];
    elegida.scrollIntoView({ behavior: 'smooth', block: 'center' });
    elegida.animate(
      [{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
      { duration: 700, easing: 'ease-in-out' }
    );
  });

  // Tema: sigue al sistema hasta que lo tocas una vez.
  const boton = document.querySelector('.tema');
  const leerTema = () => {
    try { return localStorage.getItem('tema'); } catch { return null; }
  };
  const guardado = leerTema();
  if (guardado) raiz.dataset.tema = guardado;

  boton?.addEventListener('click', () => {
    const oscuroAhora =
      raiz.dataset.tema === 'oscuro' ||
      (!raiz.dataset.tema && matchMedia('(prefers-color-scheme: dark)').matches);
    const siguiente = oscuroAhora ? 'claro' : 'oscuro';
    raiz.dataset.tema = siguiente;
    try { localStorage.setItem('tema', siguiente); } catch { /* modo privado */ }
  });

  // Estado inicial desde la URL, para poder compartir un filtro.
  const params = new URLSearchParams(location.search);
  if (params.get('q')) buscador.value = params.get('q');
  const catUrl = params.get('cat');
  const pildoraUrl = pildoras.find((p) => p.dataset.categoria === catUrl);
  if (pildoraUrl) pildoraUrl.click();
  else aplicar();
})();
