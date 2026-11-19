/**
 * Módulo de almacenamiento y operaciones CRUD de jornadas de festival.
 * Almacena los registros en localStorage bajo una clave propia por usuario (`jornadas_${nombreUsuario}`).
 * Permite además al administrador consultar y gestionar las jornadas de todos los usuarios (visión y control global).
 *
 * @module datos/jornadas
 */
import { leer, guardar } from './almacen.js';
import { obtenerUsuarios } from './usuarios.js';

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
  if (!Array.isArray(datos)) {
    return [];
  }
  return datos.map((j) =>
    j && typeof j === 'object' ? { ...j, propietario: j.propietario || nombreUsuario } : j,
  );
}

/**
 * Obtiene una jornada específica por su identificador único dentro del almacenamiento de un usuario.
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
 * Obtiene todas las jornadas almacenadas de TODOS los usuarios registrados.
 * Añade la propiedad `propietario` a cada jornada para saber a qué promotor pertenece.
 * Permite al rol administrador tener un control total de todo lo que se crea en la plataforma.
 *
 * @param {Storage|object} [almacen=localStorage]
 * @returns {Array<object>} Lista global de jornadas de todos los promotores.
 */
export function obtenerTodasLasJornadas(almacen = localStorage) {
  const usuarios = obtenerUsuarios(almacen);
  const nombresUsuarios = new Set(
    usuarios
      .map((u) => u && typeof u.nombre === 'string' && u.nombre.trim().toLowerCase())
      .filter(Boolean),
  );

  // Escaneo de claves en almacenamiento si soporta indexación (resiliencia ante usuarios preexistentes)
  if (almacen && typeof almacen.length === 'number' && typeof almacen.key === 'function') {
    for (let i = 0; i < almacen.length; i++) {
      const k = almacen.key(i);
      if (typeof k === 'string' && k.startsWith('jornadas_')) {
        const nombreExtra = k.slice('jornadas_'.length).trim().toLowerCase();
        if (nombreExtra) {
          nombresUsuarios.add(nombreExtra);
        }
      }
    }
  }

  const todas = [];
  const idsVistos = new Set();

  for (const nombre of nombresUsuarios) {
    const lista = obtenerJornadas(nombre, almacen);
    for (const jornada of lista) {
      if (jornada && jornada.id && !idsVistos.has(jornada.id)) {
        idsVistos.add(jornada.id);
        todas.push({
          ...jornada,
          propietario: jornada.propietario || nombre,
        });
      }
    }
  }

  // Ordenar de más reciente a más antigua
  todas.sort((a, b) => {
    const fechaA = new Date(a.actualizadoEn || a.creadoEn || 0).getTime();
    const fechaB = new Date(b.actualizadoEn || b.creadoEn || 0).getTime();
    return fechaB - fechaA;
  });

  return todas;
}

/**
 * Busca una jornada por su ID en todo el sistema (entre todos los promotores registrados).
 *
 * @param {string} id
 * @param {Storage|object} [almacen=localStorage]
 * @returns {object | null}
 */
export function obtenerJornadaGlobalPorId(id, almacen = localStorage) {
  if (!id) {
    return null;
  }
  const todas = obtenerTodasLasJornadas(almacen);
  return todas.find((j) => j && j.id === id) || null;
}

/**
 * Guarda o actualiza una jornada en el almacenamiento del usuario o del propietario original.
 * Si ya tiene un identificador `id`, se actualiza el registro existente en la clave de su propietario.
 * Si no dispone de `id`, se le genera un ID único con timestamp y fragmento aleatorio.
 *
 * @param {string} nombreUsuario
 * @param {object} datosJornada
 * @param {Storage|object} [almacen=localStorage]
 * @returns {object} La jornada guardada con su id, propietario y marcas temporales.
 */
export function guardarJornada(nombreUsuario, datosJornada, almacen = localStorage) {
  if (!nombreUsuario && !datosJornada?.propietario) {
    throw new Error('El nombre de usuario es obligatorio para guardar una jornada');
  }

  const usuarioEfectivo = String(datosJornada?.propietario || nombreUsuario || '')
    .trim()
    .toLowerCase();
  const clave = obtenerClaveJornadas(usuarioEfectivo);
  let jornadas = obtenerJornadas(usuarioEfectivo, almacen);
  const ahora = new Date().toISOString();

  // Modo edición: ya cuenta con un ID existente
  if (datosJornada.id) {
    let indice = jornadas.findIndex((j) => j && j.id === datosJornada.id);
    let claveDestino = clave;

    // Si no se encuentra en el usuario indicado, buscar si pertenece a otro usuario (edición de admin)
    if (indice === -1) {
      const global = obtenerJornadaGlobalPorId(datosJornada.id, almacen);
      if (global && global.propietario) {
        claveDestino = obtenerClaveJornadas(global.propietario);
        jornadas = obtenerJornadas(global.propietario, almacen);
        indice = jornadas.findIndex((j) => j && j.id === datosJornada.id);
      }
    }

    if (indice !== -1) {
      const jornadaActualizada = {
        ...jornadas[indice],
        ...datosJornada,
        propietario: jornadas[indice].propietario || datosJornada.propietario || usuarioEfectivo,
        actualizadoEn: ahora,
      };
      jornadas[indice] = jornadaActualizada;
      guardar(almacen, claveDestino, jornadas);
      return jornadaActualizada;
    }
  }

  // Modo creación: nuevo registro con id único y propietario asignado
  const nuevaJornada = {
    ...datosJornada,
    propietario: datosJornada.propietario || usuarioEfectivo,
    id: datosJornada.id || `jornada_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };

  jornadas.push(nuevaJornada);
  guardar(almacen, clave, jornadas);
  return nuevaJornada;
}

/**
 * Elimina una jornada del almacenamiento por su id.
 * Si se especifica el nombreUsuario la elimina de su clave; si no se encuentra allí o no se pasa
 * usuario, busca al propietario de forma global y la elimina (permitiendo al admin borrar cualquier festival).
 *
 * @param {string|null} nombreUsuario
 * @param {string} id
 * @param {Storage|object} [almacen=localStorage]
 * @returns {boolean} True si se encontró y eliminó, false en caso contrario.
 */
export function eliminarJornada(nombreUsuario, id, almacen = localStorage) {
  if (!id) {
    return false;
  }

  if (nombreUsuario) {
    const clave = obtenerClaveJornadas(nombreUsuario);
    const jornadas = obtenerJornadas(nombreUsuario, almacen);
    const inicial = jornadas.length;
    const filtradas = jornadas.filter((j) => j && j.id !== id);

    if (filtradas.length !== inicial) {
      guardar(almacen, clave, filtradas);
      return true;
    }
  }

  // Búsqueda global si el usuario especificado no contenía el registro (soporte para rol administrador)
  const global = obtenerJornadaGlobalPorId(id, almacen);
  if (global && global.propietario) {
    const clave = obtenerClaveJornadas(global.propietario);
    const jornadas = obtenerJornadas(global.propietario, almacen);
    const filtradas = jornadas.filter((j) => j && j.id !== id);
    guardar(almacen, clave, filtradas);
    return true;
  }

  return false;
}
