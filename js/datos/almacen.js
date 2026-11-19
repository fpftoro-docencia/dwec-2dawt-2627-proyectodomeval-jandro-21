/**
 * Módulo de almacenamiento genérico resistente a fallos.
 * Cumple con el requisito de que las lecturas no fallan si lo guardado está estropeado.
 *
 * @module datos/almacen
 */

/**
 * Lee y deserializa un valor de un almacenamiento tipo Storage.
 * Si la clave no existe o los datos están corruptos (JSON inválido), devuelve el valor por defecto.
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} almacen
 * @param {string} clave
 * @param {unknown} valorPorDefecto
 * @returns {unknown}
 */
export function leer(almacen, clave, valorPorDefecto) {
  try {
    const raw = almacen.getItem(clave);
    if (raw === null || raw === undefined) {
      return valorPorDefecto;
    }
    return JSON.parse(raw);
  } catch {
    return valorPorDefecto;
  }
}

/**
 * Serializa y guarda un valor en el almacenamiento.
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} almacen
 * @param {string} clave
 * @param {unknown} valor
 */
export function guardar(almacen, clave, valor) {
  almacen.setItem(clave, JSON.stringify(valor));
}

/**
 * Elimina una clave del almacenamiento.
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} almacen
 * @param {string} clave
 */
export function eliminar(almacen, clave) {
  almacen.removeItem(clave);
}
