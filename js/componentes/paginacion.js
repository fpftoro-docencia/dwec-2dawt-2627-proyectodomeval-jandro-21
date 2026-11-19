/**
 * Componente reutilizable de controles de paginación accesible para listado y usuarios.
 * Genera botones de Anterior, números de página y Siguiente con clases neo-brutalistas.
 *
 * @module componentes/paginacion
 */

/**
 * Renderiza los controles de paginación en el contenedor indicado.
 * Requisito 16: Controles creados desde código con estado accesible y delegación.
 * Acepta tanto un objeto de opciones `{ paginaActual, totalPaginas, alCambiarPagina }`
 * como argumentos posicionales `(contenedor, paginaActual, totalPaginas, alCambiarPagina)`.
 *
 * @param {HTMLElement} contenedor Elemento del DOM donde se insertará el bloque de paginación.
 * @param {object|number} opcionesOActual Opciones o número de página actual.
 * @param {number} [totalPaginasPosicional] Total de páginas si se llama posicionalmente.
 * @param {Function} [alCambiarPaginaPosicional] Callback si se llama posicionalmente.
 */
export function renderizarPaginacion(
  contenedor,
  opcionesOActual,
  totalPaginasPosicional,
  alCambiarPaginaPosicional,
) {
  if (!contenedor) {
    return;
  }

  let paginaActual;
  let totalPaginas;
  let alCambiarPagina;

  if (typeof opcionesOActual === 'object' && opcionesOActual !== null) {
    paginaActual = opcionesOActual.paginaActual || 1;
    totalPaginas = opcionesOActual.totalPaginas || 1;
    alCambiarPagina = opcionesOActual.alCambiarPagina || (() => {});
  } else {
    paginaActual = Number(opcionesOActual) || 1;
    totalPaginas = Number(totalPaginasPosicional) || 1;
    alCambiarPagina =
      typeof alCambiarPaginaPosicional === 'function' ? alCambiarPaginaPosicional : () => {};
  }

  contenedor.innerHTML = '';

  // Si solo hay una página o ninguna, no se muestran controles
  if (totalPaginas <= 1) {
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'pagination-edgy';

  // Botón Anterior
  const liAnterior = document.createElement('li');
  liAnterior.className = `page-item ${paginaActual <= 1 ? 'disabled' : ''}`;
  const btnAnterior = document.createElement('button');
  btnAnterior.type = 'button';
  btnAnterior.className = 'page-link btn-paginacion-anterior';
  btnAnterior.dataset.pagina = String(paginaActual - 1);
  btnAnterior.textContent = '« Anterior';
  if (paginaActual <= 1) {
    btnAnterior.disabled = true;
    btnAnterior.setAttribute('aria-disabled', 'true');
  }
  liAnterior.appendChild(btnAnterior);
  ul.appendChild(liAnterior);

  // Botones numéricos de página
  for (let p = 1; p <= totalPaginas; p += 1) {
    const liPagina = document.createElement('li');
    const esActiva = p === paginaActual;
    liPagina.className = `page-item ${esActiva ? 'active' : ''}`;

    const btnPagina = document.createElement('button');
    btnPagina.type = 'button';
    btnPagina.className = 'page-link btn-paginacion-numero';
    btnPagina.dataset.pagina = String(p);
    btnPagina.textContent = String(p);

    if (esActiva) {
      btnPagina.setAttribute('aria-current', 'page');
    }

    liPagina.appendChild(btnPagina);
    ul.appendChild(liPagina);
  }

  // Botón Siguiente
  const liSiguiente = document.createElement('li');
  liSiguiente.className = `page-item ${paginaActual >= totalPaginas ? 'disabled' : ''}`;
  const btnSiguiente = document.createElement('button');
  btnSiguiente.type = 'button';
  btnSiguiente.className = 'page-link btn-paginacion-siguiente';
  btnSiguiente.dataset.pagina = String(paginaActual + 1);
  btnSiguiente.textContent = 'Siguiente »';
  if (paginaActual >= totalPaginas) {
    btnSiguiente.disabled = true;
    btnSiguiente.setAttribute('aria-disabled', 'true');
  }
  liSiguiente.appendChild(btnSiguiente);
  ul.appendChild(liSiguiente);

  // Delegación de eventos (Requisito 20)
  ul.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-pagina]');
    if (!boton || boton.disabled || boton.getAttribute('aria-disabled') === 'true') {
      return;
    }
    const destino = parseInt(boton.dataset.pagina, 10);
    if (!Number.isNaN(destino) && destino >= 1 && destino <= totalPaginas) {
      alCambiarPagina(destino);
    }
  });

  contenedor.appendChild(ul);
}
