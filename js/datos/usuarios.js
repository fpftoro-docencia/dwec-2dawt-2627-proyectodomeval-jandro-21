/**
 * Módulo de gestión de usuarios y roles.
 *
 * @module datos/usuarios
 */
import { resumirClave } from '../clave.js';
import { leer, guardar } from './almacen.js';

export const CLAVE_USUARIOS = 'usuarios';

/**
 * Obtiene la lista completa de usuarios registrados.
 * Si los datos están dañados o no es un array, devuelve una lista vacía.
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=localStorage]
 * @returns {Array<object>}
 */
export function obtenerUsuarios(almacen = localStorage) {
  const datos = leer(almacen, CLAVE_USUARIOS, []);
  return Array.isArray(datos) ? datos : [];
}

/**
 * Busca un usuario por su nombre de usuario (sin distinguir mayúsculas).
 *
 * @param {string} nombre
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=localStorage]
 * @returns {object | null}
 */
export function buscarUsuarioPorNombre(nombre, almacen = localStorage) {
  if (!nombre) {
    return null;
  }
  const nombreLimpio = String(nombre).trim().toLowerCase();
  const usuarios = obtenerUsuarios(almacen);
  return (
    usuarios.find(
      (u) => u && typeof u.nombre === 'string' && u.nombre.toLowerCase() === nombreLimpio,
    ) || null
  );
}

/**
 * Busca un usuario por su correo electrónico.
 *
 * @param {string} correo
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=localStorage]
 * @returns {object | null}
 */
export function buscarUsuarioPorCorreo(correo, almacen = localStorage) {
  if (!correo) {
    return null;
  }
  const correoLimpio = String(correo).trim().toLowerCase();
  const usuarios = obtenerUsuarios(almacen);
  return (
    usuarios.find(
      (u) => u && typeof u.correo === 'string' && u.correo.toLowerCase() === correoLimpio,
    ) || null
  );
}

/**
 * Registra un nuevo usuario en el sistema.
 * El primer usuario registrado recibe el rol de 'administrador'. Los siguientes son 'usuario'.
 * Las contraseñas se almacenan únicamente como resumen SHA-256.
 *
 * @param {object} datos
 * @param {string} datos.nombre
 * @param {string} datos.correo
 * @param {string} datos.clave
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=localStorage]
 * @param {Function} [resumir=resumirClave]
 * @returns {Promise<object>} Datos del usuario registrado (sin clave en claro).
 */
export async function registrarUsuario(
  { nombre, correo, clave },
  almacen = localStorage,
  resumir = resumirClave,
) {
  const nombreLimpio = String(nombre).trim();
  const correoLimpio = String(correo).trim().toLowerCase();

  if (buscarUsuarioPorNombre(nombreLimpio, almacen)) {
    throw new Error('El nombre de usuario ya está en uso');
  }

  if (buscarUsuarioPorCorreo(correoLimpio, almacen)) {
    throw new Error('El correo electrónico ya está registrado');
  }

  const usuarios = obtenerUsuarios(almacen);
  // Regla de roles: el primer usuario registrado es administrador
  const rol = usuarios.length === 0 ? 'administrador' : 'usuario';
  const claveHash = await resumir(clave);

  const nuevoUsuario = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    nombre: nombreLimpio,
    correo: correoLimpio,
    claveHash,
    rol,
    creadoEn: new Date().toISOString(),
  };

  usuarios.push(nuevoUsuario);
  guardar(almacen, CLAVE_USUARIOS, usuarios);

  return {
    id: nuevoUsuario.id,
    nombre: nuevoUsuario.nombre,
    correo: nuevoUsuario.correo,
    rol: nuevoUsuario.rol,
  };
}

/**
 * Verifica el nombre y la contraseña frente a los registros almacenados.
 *
 * @param {string} nombre
 * @param {string} clave
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=localStorage]
 * @param {Function} [resumir=resumirClave]
 * @returns {Promise<object | null>} Objeto de usuario si las credenciales coinciden, o null si fallan.
 */
export async function verificarCredenciales(
  nombre,
  clave,
  almacen = localStorage,
  resumir = resumirClave,
) {
  const usuario = buscarUsuarioPorNombre(nombre, almacen);
  if (!usuario || !usuario.claveHash) {
    return null;
  }

  const hashCalculado = await resumir(clave);
  if (hashCalculado !== usuario.claveHash) {
    return null;
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
}
