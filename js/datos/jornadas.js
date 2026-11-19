/**
 * Módulo de almacenamiento y operaciones CRUD de jornadas de festival.
 * Almacena los registros en localStorage bajo una clave propia por usuario (`jornadas_${nombreUsuario}`).
 *
 * @module datos/jornadas
 */
import { leer, guardar } from './almacen.js';

/**
 * Genera la clave de almacenamiento propia para las jornadas de un usuario concreto.
 *
 * @param {string} nombreUsuario
 * @returns {string}
 */
export function obtenerClaveJornadas(nombreUsuario) {
  const usuarioSeguro = String(nombreUsuario || '')
    .trim()
    .toLowerCase();
  return `jornadas_${usuarioSeguro}`;
}

/**
 * Obtiene todas las jornadas almacenadas para un usuario.
 * Resiliente ante datos corruptos en el almacenamiento (devuelve array vacío).
 *
 * @param {string} nombreUsuario
 * @param {Storage|object} [almacen=localStorage]
 * @returns {Array<object>}
 */
export function obtenerJornadas(nombreUsuario, almacen = localStorage) {
  if (!nombreUsuario) {
    return [];
  }
  const clave = obtenerClaveJornadas(nombreUsuario);
  const datos = leer(almacen, clave, []);
  return Array.isArray(datos) ? datos : [];
}

/**
 * Obtiene una jornada específica por su identificador único.
 *
 * @param {string} nombreUsuario
 * @param {string} id
 * @param {Storage|object} [almacen=localStorage]
 * @returns {object | null}
 */
export function obtenerJornadaPorId(nombreUsuario, id, almacen = localStorage) {
  if (!nombreUsuario || !id) {
    return null;
  }
  const jornadas = obtenerJornadas(nombreUsuario, almacen);
  return jornadas.find((j) => j && j.id === id) || null;
}

/**
 * Guarda o actualiza una jornada en el almacenamiento del usuario.
 * Si ya tiene un identificador `id`, se actualiza el registro existente.
 * Si no dispone de `id`, se le genera un ID único con timestamp y fragmento aleatorio.
 *
 * @param {string} nombreUsuario
 * @param {object} datosJornada
 * @param {Storage|object} [almacen=localStorage]
 * @returns {object} La jornada guardada con su id y marcas temporales.
 */
export function guardarJornada(nombreUsuario, datosJornada, almacen = localStorage) {
  if (!nombreUsuario) {
    throw new Error('El nombre de usuario es obligatorio para guardar una jornada');
  }

  const clave = obtenerClaveJornadas(nombreUsuario);
  const jornadas = obtenerJornadas(nombreUsuario, almacen);
  const ahora = new Date().toISOString();

  // Modo edición: ya cuenta con un ID existente
  if (datosJornada.id) {
    const indice = jornadas.findIndex((j) => j && j.id === datosJornada.id);
    if (indice !== -1) {
      const jornadaActualizada = {
        ...jornadas[indice],
        ...datosJornada,
        actualizadoEn: ahora,
      };
      jornadas[indice] = jornadaActualizada;
      guardar(almacen, clave, jornadas);
      return jornadaActualizada;
    }
  }

  // Modo creación: nuevo registro con id único
  const nuevaJornada = {
    ...datosJornada,
    id: `jornada_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };

  jornadas.push(nuevaJornada);
  guardar(almacen, clave, jornadas);
  return nuevaJornada;
}

/**
 * Elimina una jornada del almacenamiento por su id.
 *
 * @param {string} nombreUsuario
 * @param {string} id
 * @param {Storage|object} [almacen=localStorage]
 * @returns {boolean} True si se encontró y eliminó, false en caso contrario.
 */
export function eliminarJornada(nombreUsuario, id, almacen = localStorage) {
  if (!nombreUsuario || !id) {
    return false;
  }
  const clave = obtenerClaveJornadas(nombreUsuario);
  const jornadas = obtenerJornadas(nombreUsuario, almacen);
  const inicial = jornadas.length;
  const filtradas = jornadas.filter((j) => j && j.id !== id);

  if (filtradas.length === inicial) {
    return false;
  }

  guardar(almacen, clave, filtradas);
  return true;
}
