/**
 * Módulo de gestión de la sesión activa en el navegador.
 *
 * @module datos/sesion
 */
import { leer, guardar, eliminar } from './almacen.js';

export const CLAVE_SESION = 'sesion';

/**
 * Obtiene los datos de la sesión activa.
 * Devuelve null si no hay sesión o si la información almacenada está corrupta.
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=sessionStorage]
 * @returns {{ nombre: string, rol: string } | null}
 */
export function obtenerSesion(almacen = sessionStorage) {
  const sesion = leer(almacen, CLAVE_SESION, null);
  if (
    !sesion ||
    typeof sesion !== 'object' ||
    typeof sesion.nombre !== 'string' ||
    typeof sesion.rol !== 'string'
  ) {
    return null;
  }
  return {
    nombre: sesion.nombre,
    rol: sesion.rol,
  };
}

/**
 * Inicia la sesión para un usuario autenticado.
 *
 * @param {object} usuario
 * @param {string} usuario.nombre
 * @param {string} usuario.rol
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=sessionStorage]
 */
export function iniciarSesion(usuario, almacen = sessionStorage) {
  if (!usuario || !usuario.nombre || !usuario.rol) {
    throw new Error('Datos de sesión incompletos para iniciar sesión');
  }
  guardar(almacen, CLAVE_SESION, {
    nombre: usuario.nombre,
    rol: usuario.rol,
  });
}

/**
 * Cierra la sesión activa actual eliminando sus datos del almacenamiento.
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=sessionStorage]
 */
export function cerrarSesion(almacen = sessionStorage) {
  eliminar(almacen, CLAVE_SESION);
}

/**
 * Comprueba si existe una sesión activa y válida.
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=sessionStorage]
 * @returns {boolean}
 */
export function haySesion(almacen = sessionStorage) {
  return obtenerSesion(almacen) !== null;
}

/**
 * Determina si el usuario de la sesión activa tiene el rol de administrador.
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=sessionStorage]
 * @returns {boolean}
 */
export function esAdministrador(almacen = sessionStorage) {
  const sesion = obtenerSesion(almacen);
  return sesion !== null && sesion.rol === 'administrador';
}
