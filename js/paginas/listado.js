/**
 * Controlador de la página del catálogo y cartel de festivales (listado.html).
 * Implementa búsqueda con debounce insensible a mayúsculas y acentos,
 * renderizado mediante template y textContent (inmune a XSS),
 * paginación sincronizada con la URL e interfaz modal accesible con <dialog>.
 *
 * @module paginas/listado
 */
import { haySesion, obtenerUsuarioActual } from '../datos/sesion.js';
import { obtenerJornadas, eliminarJornada } from '../datos/jornadas.js';
import { paginar } from '../logica/paginar.js';
import { renderizarPaginacion } from '../componentes/paginacion.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarAvisos, lanzarAviso } from '../componentes/avisos.js';
import { iniciarTema } from '../componentes/tema.js';

const ELEMENTOS_POR_PAGINA = 3;

/**
 * Normaliza una cadena de texto para búsquedas insensibles a mayúsculas y tildes.
 *
 * @param {string} texto
 * @returns {string}
 */
export function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Inicializa la página del listado de festivales.
 *
 * @param {Document} [documento=document]
 * @param {object} [opciones={}]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {Storage} [opciones.almacenJornadas=localStorage]
 * @param {Function} [opciones.navegar]
 * @param {number} [opciones.debounceMs=300] Tiempo de espera para el buscador.
 */
export function iniciarPaginaListado(
  documento = document,
  {
    almacenSesion = sessionStorage,
    almacenJornadas = localStorage,
    navegar = (url) => location.assign(url),
    debounceMs = 300,
  } = {},
) {
  // 1. Protección de página privada: sin sesión redirige a index.html
  if (!haySesion(almacenSesion)) {
    navegar('index.html');
    return;
  }

  iniciarTema(documento);
  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento, { almacenSesion, navegar });

  const usuarioActual = obtenerUsuarioActual(almacenSesion);
  if (!usuarioActual) {
    navegar('index.html');
    return;
  }

  const contenedorJornadas = documento.querySelector('#contenedor-jornadas');
  const mensajeVacio = documento.querySelector('#mensaje-vacio');
  const contadorResultados = documento.querySelector('#contador-resultados');
  const inputBuscador = documento.querySelector('#input-buscador');
  const navPaginacion = documento.querySelector('#nav-paginacion');
  const templateJornada = documento.querySelector('#tpl-jornada');

  // Elementos del modal de confirmación <dialog>
  const dialogBorrado = documento.querySelector('#dialog-confirmar-borrado');
  const nombreJornadaBorrar = documento.querySelector('#nombre-jornada-borrar');
  const btnCancelarBorrado = documento.querySelector('#btn-cancelar-borrado');
  const btnAceptarBorrado = documento.querySelector('#btn-aceptar-borrado');

  let idJornadaABorrar = null;
  let temporizadorDebounce = null;

  // Leer página inicial desde la URL (?pagina=X)
  let paginaActual = 1;
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const pagUrl = parseInt(params.get('pagina'), 10);
    if (!Number.isNaN(pagUrl) && pagUrl >= 1) {
      paginaActual = pagUrl;
    }
  }

  /**
   * Actualiza el parámetro ?pagina en la barra de direcciones del navegador
   * sin recargar la página mediante history.replaceState (Requisito 16).
   *
   * @param {number} pag
   */
  const sincronizarUrlPagina = (pag) => {
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('pagina', String(pag));
      window.history.replaceState({}, '', url.toString());
    }
  };

  /**
   * Obtiene la lista de jornadas del usuario y aplica el filtro de búsqueda.
   *
   * @returns {Array<object>}
   */
  const obtenerJornadasFiltradas = () => {
    const todas = obtenerJornadas(usuarioActual.nombre, almacenJornadas);
    const termino = inputBuscador ? normalizarTexto(inputBuscador.value.trim()) : '';

    if (!termino) {
      return todas;
    }

    return todas.filter((j) => {
      const nombre = normalizarTexto(j.nombreJornada);
      const genero = normalizarTexto(j.generoMusical);
      const licencia = normalizarTexto(j.codigoLicencia);
      const cif = normalizarTexto(j.cifPromotora);
      return (
        nombre.includes(termino) ||
        genero.includes(termino) ||
        licencia.includes(termino) ||
        cif.includes(termino)
      );
    });
  };

  /**
   * Renderiza el catálogo de jornadas y actualiza contadores y paginación.
   * Requisito 15: Creado desde template y rellenado con textContent y atributos (cero innerHTML con datos).
   */
  const renderizarListado = () => {
    const filtradas = obtenerJornadasFiltradas();
    const resultadoPaginacion = paginar(filtradas, paginaActual, ELEMENTOS_POR_PAGINA);

    paginaActual = resultadoPaginacion.pagina;
    sincronizarUrlPagina(paginaActual);

    // Actualizar contador accesible
    if (contadorResultados) {
      const total = resultadoPaginacion.totalElementos;
      contadorResultados.textContent = `${total} ${total === 1 ? 'jornada encontrada' : 'jornadas encontradas'}`;
    }

    // Gestionar mensaje de lista vacía
    if (resultadoPaginacion.totalElementos === 0) {
      if (contenedorJornadas) {
        contenedorJornadas.innerHTML = '';
        contenedorJornadas.hidden = true;
      }
      if (mensajeVacio) {
        mensajeVacio.hidden = false;
      }
      if (navPaginacion) {
        navPaginacion.innerHTML = '';
      }
      return;
    }

    if (mensajeVacio) {
      mensajeVacio.hidden = true;
    }
    if (contenedorJornadas) {
      contenedorJornadas.hidden = false;
      contenedorJornadas.innerHTML = '';
    }

    if (!templateJornada || !contenedorJornadas) {
      return;
    }

    const fragmento = documento.createDocumentFragment();

    resultadoPaginacion.elementos.forEach((jornada) => {
      const clon = templateJornada.content.cloneNode(true);

      const elNombre = clon.querySelector('.jornada-nombre');
      if (elNombre) {
        elNombre.textContent = jornada.nombreJornada;
      }

      const elGenero = clon.querySelector('.badge-genero');
      if (elGenero) {
        elGenero.textContent = jornada.generoMusical;
      }

      const elAcceso = clon.querySelector('.badge-acceso');
      if (elAcceso) {
        elAcceso.textContent = `Acceso ${jornada.tipoAcceso}`;
      }

      const elAforo = clon.querySelector('.jornada-aforo');
      if (elAforo) {
        elAforo.textContent = Number(jornada.aforoMaximo).toLocaleString('es-ES');
      }

      const elFecha = clon.querySelector('.jornada-fecha');
      if (elFecha) {
        elFecha.textContent = jornada.fechaEvento;
      }

      const elLicencia = clon.querySelector('.jornada-licencia');
      if (elLicencia) {
        elLicencia.textContent = jornada.codigoLicencia;
      }

      const elTelefono = clon.querySelector('.jornada-telefono');
      if (elTelefono) {
        elTelefono.textContent = jornada.telefonoContacto;
      }

      const elCif = clon.querySelector('.jornada-cif');
      if (elCif) {
        elCif.textContent = jornada.cifPromotora;
      }

      // Suplemento VIP condicional
      const contenedorSuplemento = clon.querySelector('.jornada-suplemento-info');
      const elSuplemento = clon.querySelector('.jornada-suplemento');
      if (
        jornada.tipoAcceso === 'vip' &&
        jornada.suplementoVip !== null &&
        jornada.suplementoVip !== undefined
      ) {
        if (contenedorSuplemento && elSuplemento) {
          contenedorSuplemento.hidden = false;
          elSuplemento.textContent = `${Number(jornada.suplementoVip).toFixed(2)} €`;
        }
      }

      // Patrocinadores
      const elPatrocinadores = clon.querySelector('.jornada-patrocinadores');
      if (elPatrocinadores) {
        const listaPat =
          Array.isArray(jornada.patrocinadores) && jornada.patrocinadores.length > 0
            ? jornada.patrocinadores.join(', ')
            : 'Sin patrocinadores asignados';
        elPatrocinadores.textContent = listaPat;
      }

      // Enlace editar
      const enlaceEditar = clon.querySelector('.enlace-editar');
      if (enlaceEditar) {
        enlaceEditar.href = `ficha.html?id=${encodeURIComponent(jornada.id)}`;
      }

      // Botón borrar
      const btnBorrar = clon.querySelector('.btn-borrar');
      if (btnBorrar) {
        btnBorrar.dataset.id = jornada.id;
        btnBorrar.dataset.nombre = jornada.nombreJornada;
      }

      fragmento.appendChild(clon);
    });

    // Sustitución del contenido de una sola vez
    contenedorJornadas.appendChild(fragmento);

    // Renderizar controles de paginación
    renderizarPaginacion(navPaginacion, {
      paginaActual: resultadoPaginacion.pagina,
      totalPaginas: resultadoPaginacion.totalPaginas,
      alCambiarPagina: (nuevaPagina) => {
        paginaActual = nuevaPagina;
        renderizarListado();
      },
    });
  };

  // 2. Buscador con Debounce (Requisito 15)
  if (inputBuscador) {
    inputBuscador.addEventListener('input', () => {
      clearTimeout(temporizadorDebounce);
      temporizadorDebounce = setTimeout(() => {
        // Requisito 16: Al buscar se vuelve a la página 1
        paginaActual = 1;
        renderizarListado();
      }, debounceMs);
    });
  }

  // 3. Delegación de eventos en el contenedor para el borrado (Requisito 20)
  if (contenedorJornadas) {
    contenedorJornadas.addEventListener('click', (evento) => {
      const btnBorrar = evento.target.closest('.btn-borrar');
      if (!btnBorrar) {
        return;
      }

      idJornadaABorrar = btnBorrar.dataset.id;
      const nombre = btnBorrar.dataset.nombre || 'esta jornada';

      if (nombreJornadaBorrar) {
        nombreJornadaBorrar.textContent = nombre;
      }

      if (dialogBorrado) {
        if (typeof dialogBorrado.showModal === 'function') {
          dialogBorrado.showModal();
        } else {
          dialogBorrado.setAttribute('open', '');
        }
      }
    });
  }

  // Cerrar modal de confirmación
  if (btnCancelarBorrado && dialogBorrado) {
    btnCancelarBorrado.addEventListener('click', () => {
      idJornadaABorrar = null;
      if (typeof dialogBorrado.close === 'function') {
        dialogBorrado.close();
      } else {
        dialogBorrado.removeAttribute('open');
      }
    });
  }

  // Confirmar eliminación de la jornada
  if (btnAceptarBorrado && dialogBorrado) {
    btnAceptarBorrado.addEventListener('click', () => {
      if (idJornadaABorrar) {
        eliminarJornada(usuarioActual.nombre, idJornadaABorrar, almacenJornadas);
        idJornadaABorrar = null;

        if (typeof dialogBorrado.close === 'function') {
          dialogBorrado.close();
        } else {
          dialogBorrado.removeAttribute('open');
        }

        lanzarAviso(documento.body, 'Jornada eliminada correctamente del cartel', 'info');

        renderizarListado();
      }
    });
  }

  // Carga inicial del catálogo
  renderizarListado();
}

// Auto-arranque en navegador
if (typeof window !== 'undefined' && document.querySelector('#contenedor-jornadas')) {
  iniciarPaginaListado(document);
}
