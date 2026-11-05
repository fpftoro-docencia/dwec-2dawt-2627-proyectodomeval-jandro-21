/**
 * Controlador de la página de gestión de promotores (usuarios.html).
 * Exclusiva para usuarios con rol 'administrador'.
 *
 * @module paginas/usuarios
 */
import { haySesion, esAdministrador } from '../datos/sesion.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import {
  iniciarAvisos,
  guardarAvisoParaSiguientePagina,
} from '../componentes/avisos.js';

/**
 * Inicializa la página de administración de usuarios.
 *
 * @param {Document} [documento=document]
 * @param {object} [opciones={}]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {(url: string) => void} [opciones.navegar=(url) => location.replace(url)]
 */
export function iniciarPaginaUsuarios(
  documento = document,
  { almacenSesion = sessionStorage, navegar = (url) => location.replace(url) } = {}
) {
  // Protección 1: Si no hay sesión, expulsa a index.html
  if (!haySesion(almacenSesion)) {
    navegar('index.html');
    return;
  }

  // Protección 2: Si el usuario no es administrador, expulsa a listado.html con aviso de error
  if (!esAdministrador(almacenSesion)) {
    guardarAvisoParaSiguientePagina(
      'Acceso denegado: solo los administradores pueden acceder a la gestión de usuarios',
      'danger',
      almacenSesion
    );
    navegar('listado.html');
    return;
  }

  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento, { almacenSesion, navegar });
}

// Auto-arranque en navegador
if (typeof window !== 'undefined' && document.querySelector('#cabecera-usuario')) {
  iniciarPaginaUsuarios(document);
}
