/**
 * Controlador de la página del catálogo y cartel de festivales (listado.html).
 * Implementa búsqueda con debounce insensible a mayúsculas y acentos,
 * renderizado mediante template y textContent (inmune a XSS),
 * paginación sincronizada con la URL e interfaz modal accesible con <dialog>.
 * Soporta control global para administradores: visualización y gestión de las
 * jornadas de todos los promotores de la plataforma.
 *
 * @module paginas/listado
 */
import { haySesion, obtenerUsuarioActual } from '../datos/sesion.js';
import { obtenerJornadas, obtenerTodasLasJornadas, eliminarJornada } from '../datos/jornadas.js';
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

  const esAdmin = usuarioActual.rol === 'administrador';

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
  let propietarioJornadaABorrar = null;
  let temporizadorDebounce = null;

  // Ajuste visual para el rol administrador (Control Total de Festivales)
  if (esAdmin) {
    const subtituloListado = documento.querySelector('#subtitulo-listado');
    if (subtituloListado) {
      subtituloListado.textContent =
        'Panel Global de Administrador · Control total de jornadas de todos los promotores';
    }
    const badgeOficial = documento.querySelector('.badge-fest-lime');
    if (badgeOficial) {
      badgeOficial.textContent = 'Control Total · Administrador';
    }
    if (inputBuscador) {
      inputBuscador.placeholder = 'Buscar por nombre, género, licencia, CIF o promotor...';
    }
  }

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
   * Obtiene la lista de jornadas (del usuario o todas si es administrador) y aplica el filtro.
   *
   * @returns {Array<object>}
   */
  const obtenerJornadasFiltradas = () => {
    const todas = esAdmin
      ? obtenerTodasLasJornadas(almacenJornadas)
      : obtenerJornadas(usuarioActual.nombre, almacenJornadas);
    const termino = inputBuscador ? normalizarTexto(inputBuscador.value.trim()) : '';

    if (!termino) {
      return todas;
    }

    return todas.filter((j) => {
      const nombre = normalizarTexto(j.nombreJornada);
      const genero = normalizarTexto(j.generoMusical);
      const licencia = normalizarTexto(j.codigoLicencia);
      const cif = normalizarTexto(j.cifPromotora);
      const propietario = normalizarTexto(j.propietario);
      return (
        nombre.includes(termino) ||
        genero.includes(termino) ||
        licencia.includes(termino) ||
        cif.includes(termino) ||
        propietario.includes(termino)
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

      // Insignia de promotor propietario (especialmente para visibilidad del administrador)
      const elPromotor = clon.querySelector('.badge-promotor');
      if (elPromotor) {
        const nombrePromotor = jornada.propietario || usuarioActual.nombre;
        elPromotor.textContent = `Promotor: @${nombrePromotor}`;
        elPromotor.hidden = false;
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
        enlaceEditar.dataset.id = jornada.id;
        if (jornada.propietario) {
          enlaceEditar.dataset.propietario = jornada.propietario;
        }
      }

      // Botón borrar
      const btnBorrar = clon.querySelector('.btn-borrar');
      if (btnBorrar) {
        btnBorrar.dataset.id = jornada.id;
        btnBorrar.dataset.nombre = jornada.nombreJornada;
        if (jornada.propietario) {
          btnBorrar.dataset.propietario = jornada.propietario;
        }
      }

      fragmento.appendChild(clon);
    });

    contenedorJornadas.appendChild(fragmento);

    // Requisito 16: Renderizar componente reutilizable de paginación
    if (navPaginacion) {
      renderizarPaginacion(
        navPaginacion,
        resultadoPaginacion.pagina,
        resultadoPaginacion.totalPaginas,
        (nuevaPagina) => {
          paginaActual = nuevaPagina;
          renderizarListado();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      );
    }
  };

  // Render inicial del catálogo
  renderizarListado();

  // 2. Buscador en tiempo real con patrón Debounce de 300 ms (Requisito 15)
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
      propietarioJornadaABorrar = btnBorrar.dataset.propietario || usuarioActual.nombre;
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
      propietarioJornadaABorrar = null;
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
        eliminarJornada(propietarioJornadaABorrar, idJornadaABorrar, almacenJornadas);
        idJornadaABorrar = null;
        propietarioJornadaABorrar = null;

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
}

// Auto-arranque en navegador
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#contenedor-jornadas')) {
      iniciarPaginaListado(document);
    }
  });
}
