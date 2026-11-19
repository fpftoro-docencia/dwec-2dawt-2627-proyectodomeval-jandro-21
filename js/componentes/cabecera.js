/**
 * Componente de cabecera compartida para páginas privadas.
 * Actualiza el usuario activo, muestra la opción de 'Usuarios' solo a administradores
 * y gestiona el cierre de sesión seguro.
 *
 * @module componentes/cabecera
 */
import { obtenerSesion, cerrarSesion } from '../datos/sesion.js';
import { guardarAvisoParaSiguientePagina } from './avisos.js';

/**
 * Inicializa y sincroniza la cabecera con la sesión activa.
 *
 * @param {Document} [documento=document]
 * @param {object} [opciones={}]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {(url: string) => void} [opciones.navegar=(url) => location.replace(url)]
 */
export function iniciarCabecera(
  documento = document,
  { almacenSesion = sessionStorage, navegar = (url) => location.replace(url) } = {},
) {
  const sesion = obtenerSesion(almacenSesion);
  if (!sesion) {
    return;
  }

  // Nombre de usuario
  const elUsuario = documento.querySelector('#cabecera-usuario');
  if (elUsuario) {
    elUsuario.textContent = sesion.nombre;
  }

  // Rol del usuario
  const elRol = documento.querySelector('#cabecera-rol');
  if (elRol) {
    const esAdmin = sesion.rol === 'administrador';
    elRol.textContent = esAdmin ? 'ADMINISTRADOR' : 'PROMOTOR';
    elRol.className = esAdmin ? 'badge badge-admin' : 'badge badge-usuario';
  }

  // Enlace a "Usuarios" (solo visible para administradores)
  const navUsuarios = documento.querySelector('#enlace-nav-usuarios');
  if (navUsuarios) {
    if (sesion.rol === 'administrador') {
      navUsuarios.removeAttribute('hidden');
    } else {
      navUsuarios.setAttribute('hidden', '');
    }
  }

  // Botón de cerrar sesión
  const btnCerrar = documento.querySelector('#btn-cerrar-sesion');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', () => {
      cerrarSesion(almacenSesion);
      guardarAvisoParaSiguientePagina('Has cerrado la sesión correctamente', 'info', almacenSesion);
      navegar('index.html');
    });
  }
}
