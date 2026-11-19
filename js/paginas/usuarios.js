/**
 * Controlador de la página de gestión de promotores y roles (usuarios.html).
 * Exclusiva para usuarios con rol 'administrador'.
 * Permite buscar, paginar y conmutar el rol de administrador de otros promotores,
 * con salvaguarda accesible contra auto-degradación.
 *
 * @module paginas/usuarios
 */
import { haySesion, esAdministrador, obtenerUsuarioActual } from '../datos/sesion.js';
import { obtenerUsuarios, cambiarRolUsuario } from '../datos/usuarios.js';
import { obtenerJornadas } from '../datos/jornadas.js';
import { paginar } from '../logica/paginar.js';
import { renderizarPaginacion } from '../componentes/paginacion.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import {
  iniciarAvisos,
  lanzarAviso,
  guardarAvisoParaSiguientePagina,
} from '../componentes/avisos.js';
import { iniciarTema } from '../componentes/tema.js';

const USUARIOS_POR_PAGINA = 4;

/**
 * Normaliza cadenas de texto para búsquedas insensibles a mayúsculas y tildes.
 *
 * @param {string} txt
 * @returns {string}
 */
function normalizar(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Inicializa la página de administración de usuarios.
 *
 * @param {Document} [documento=document]
 * @param {object} [opciones={}]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {Storage} [opciones.almacenUsuarios=localStorage]
 * @param {Function} [opciones.navegar]
 * @param {number} [opciones.debounceMs=300]
 */
export function iniciarPaginaUsuarios(
  documento = document,
  {
    almacenSesion = sessionStorage,
    almacenUsuarios = localStorage,
    navegar = (url) => location.assign(url),
    debounceMs = 300,
  } = {},
) {
  // 1. Protección 1: Si no hay sesión, expulsa a index.html
  if (!haySesion(almacenSesion)) {
    navegar('index.html');
    return;
  }

  // Protección 2: Si el usuario no es administrador, expulsa a listado.html con aviso de error
  if (!esAdministrador(almacenSesion)) {
    guardarAvisoParaSiguientePagina(
      'Acceso denegado: solo los administradores pueden acceder a la gestión de usuarios',
      'danger',
      almacenSesion,
    );
    navegar('listado.html');
    return;
  }

  iniciarTema(documento);
  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento, { almacenSesion, navegar });

  const usuarioActivo = obtenerUsuarioActual(almacenSesion);
  if (!usuarioActivo) {
    navegar('index.html');
    return;
  }

  const contenedorUsuarios = documento.querySelector('#contenedor-usuarios');
  const templateFila = documento.querySelector('#tpl-fila-usuario');
  const inputBuscador = documento.querySelector('#input-buscador-usuarios');
  const contadorUsuarios = documento.querySelector('#contador-usuarios');
  const mensajeVacio = documento.querySelector('#mensaje-vacio-usuarios');
  const navPaginacion = documento.querySelector('#nav-paginacion-usuarios');

  let paginaActual = 1;
  let temporizadorDebounce = null;

  // Leer página de la URL si existe
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    const pag = parseInt(params.get('pagina'), 10);
    if (!Number.isNaN(pag) && pag >= 1) {
      paginaActual = pag;
    }
  }

  const sincronizarUrl = (pag) => {
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.set('pagina', String(pag));
      window.history.replaceState({}, '', url.toString());
    }
  };

  const obtenerUsuariosFiltrados = () => {
    const todos = obtenerUsuarios(almacenUsuarios);
    const termino = inputBuscador ? normalizar(inputBuscador.value.trim()) : '';

    if (!termino) {
      return todos;
    }

    return todos.filter((u) => {
      const nombre = normalizar(u.nombre);
      const correo = normalizar(u.correo);
      return nombre.includes(termino) || correo.includes(termino);
    });
  };

  const renderizarTabla = () => {
    const filtrados = obtenerUsuariosFiltrados();
    const resultado = paginar(filtrados, paginaActual, USUARIOS_POR_PAGINA);

    paginaActual = resultado.pagina;
    sincronizarUrl(paginaActual);

    if (contadorUsuarios) {
      const total = resultado.totalElementos;
      contadorUsuarios.textContent = `${total} ${total === 1 ? 'promotor registrado' : 'promotores registrados'}`;
    }

    if (resultado.totalElementos === 0) {
      if (contenedorUsuarios) {
        contenedorUsuarios.innerHTML = '';
        contenedorUsuarios.hidden = true;
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
    if (contenedorUsuarios) {
      contenedorUsuarios.hidden = false;
      contenedorUsuarios.innerHTML = '';
    }
    if (!contenedorUsuarios || !templateFila) {
      return;
    }

    const fragmento = documento.createDocumentFragment();

    resultado.elementos.forEach((usuario) => {
      const clon = templateFila.content.cloneNode(true);

      const elNombre = clon.querySelector('.usuario-nombre');
      if (elNombre) {
        elNombre.textContent = usuario.nombre;
      }

      const elCorreo = clon.querySelector('.usuario-correo');
      if (elCorreo) {
        elCorreo.textContent = usuario.correo;
      }

      const elBadge = clon.querySelector('.usuario-badge-rol');
      if (elBadge) {
        elBadge.textContent = usuario.rol.toUpperCase();
        elBadge.className = `badge ${usuario.rol === 'administrador' ? 'badge-admin' : 'badge-usuario'} usuario-badge-rol`;
      }

      const elNumJornadas = clon.querySelector('.usuario-num-jornadas');
      if (elNumJornadas) {
        const totalJornadas = obtenerJornadas(usuario.nombre, almacenUsuarios).length;
        elNumJornadas.textContent = `${totalJornadas} ${totalJornadas === 1 ? 'jornada' : 'jornadas'}`;
      }

      const btnRol = clon.querySelector('.btn-cambiar-rol');
      if (btnRol) {
        const esMismoUsuario =
          (usuario.id && usuarioActivo.id && usuario.id === usuarioActivo.id) ||
          (usuario.nombre &&
            usuarioActivo.nombre &&
            usuario.nombre.toLowerCase() === usuarioActivo.nombre.toLowerCase());

        // Requisito 18: Un administrador no puede quitarse el rol a sí mismo
        if (esMismoUsuario) {
          btnRol.disabled = true;
          btnRol.setAttribute('aria-disabled', 'true');
          btnRol.title =
            'No puedes quitarte el rol de administrador a ti mismo para asegurar que siempre haya al menos uno';
          btnRol.textContent = 'Tu cuenta (Admin)';
          btnRol.classList.add('opacity-50');
        } else if (usuario.rol === 'administrador') {
          btnRol.textContent = 'Quitar Administrador';
          btnRol.dataset.id = usuario.id;
          btnRol.dataset.nombre = usuario.nombre;
          btnRol.dataset.nuevoRol = 'usuario';
        } else {
          btnRol.textContent = 'Hacer Administrador';
          btnRol.dataset.id = usuario.id;
          btnRol.dataset.nombre = usuario.nombre;
          btnRol.dataset.nuevoRol = 'administrador';
        }
      }

      fragmento.appendChild(clon);
    });

    contenedorUsuarios.appendChild(fragmento);

    // Controles de paginación
    renderizarPaginacion(navPaginacion, {
      paginaActual: resultado.pagina,
      totalPaginas: resultado.totalPaginas,
      alCambiarPagina: (nuevaPagina) => {
        paginaActual = nuevaPagina;
        renderizarTabla();
      },
    });
  };

  // Buscador con debounce
  if (inputBuscador) {
    inputBuscador.addEventListener('input', () => {
      clearTimeout(temporizadorDebounce);
      temporizadorDebounce = setTimeout(() => {
        paginaActual = 1;
        renderizarTabla();
      }, debounceMs);
    });
  }

  // Delegación de eventos en contenedorUsuarios para cambio de rol (Requisito 20)
  if (contenedorUsuarios) {
    contenedorUsuarios.addEventListener('click', (evento) => {
      const boton = evento.target.closest('.btn-cambiar-rol');
      if (!boton || boton.disabled || boton.getAttribute('aria-disabled') === 'true') {
        return;
      }

      const id = boton.dataset.id;
      const nuevoRol = boton.dataset.nuevoRol;
      const nombre = boton.dataset.nombre;

      if (id && nuevoRol) {
        cambiarRolUsuario(id, nuevoRol, almacenUsuarios);
        lanzarAviso(
          documento.body,
          `El rol del promotor ${nombre} ha sido actualizado a ${nuevoRol}`,
          'success',
        );
        renderizarTabla();
      }
    });
  }

  renderizarTabla();
}

// Auto-arranque en navegador
if (typeof window !== 'undefined' && document.querySelector('#contenedor-usuarios')) {
  iniciarPaginaUsuarios(document);
}
