/**
 * Componente reutilizable de controles de paginación accesible para listado y usuarios.
 * Genera botones de Anterior, números de página y Siguiente con clases neo-brutalistas.
 *
 * @module componentes/paginacion
 */

/**
 * Renderiza los controles de paginación en el contenedor indicado.
 * Requisito 16: Controles creados desde código con estado accesible y delegación.
 *
 * @param {HTMLElement} contenedor Elemento del DOM donde se insertará el bloque de paginación.
 * @param {object} opciones
 * @param {number} opciones.paginaActual
 * @param {number} opciones.totalPaginas
 * @param {Function} opciones.alCambiarPagina
 */
export function renderizarPaginacion(contenedor, { paginaActual, totalPaginas, alCambiarPagina }) {
  if (!contenedor) {
    return;
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
