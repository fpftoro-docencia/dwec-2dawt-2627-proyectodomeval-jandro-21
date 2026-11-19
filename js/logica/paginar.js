/**
 * Módulo de paginación pura.
 * Función sin efectos secundarios ni acceso al DOM.
 *
 * @module logica/paginar
 */

/**
 * Pagina una lista de elementos según la página solicitada y el tamaño de página.
 * Corrige automáticamente páginas inexistentes a la más cercana válida.
 *
 * @template T
 * @param {Array<T>} [lista=[]] - Colección de elementos a paginar.
 * @param {number|string} [pagina=1] - Número de página deseada (base 1).
 * @param {number} [porPagina=5] - Cantidad de elementos por página.
 * @returns {{
 *   elementos: Array<T>,
 *   pagina: number,
 *   totalPaginas: number,
 *   totalElementos: number
 * }} Resultado de la paginación con datos y metadatos de control.
 *
 * @example
 * const res = paginar(['a', 'b', 'c', 'd', 'e', 'f'], 2, 2);
 * // res.elementos -> ['c', 'd']
 * // res.pagina -> 2
 * // res.totalPaginas -> 3
 * // res.totalElementos -> 6
 */
export function paginar(lista = [], pagina = 1, porPagina = 5) {
  const elementosTotales = Array.isArray(lista) ? lista.length : 0;
  const itemsPorPagina = Number.isInteger(porPagina) && porPagina > 0 ? porPagina : 5;

  const totalPaginas = Math.max(1, Math.ceil(elementosTotales / itemsPorPagina));

  let paginaSolicitada = parseInt(pagina, 10);
  if (Number.isNaN(paginaSolicitada) || paginaSolicitada < 1) {
    paginaSolicitada = 1;
  }

  const paginaCorregida = Math.min(paginaSolicitada, totalPaginas);

  const inicio = (paginaCorregida - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const elementos = Array.isArray(lista) ? lista.slice(inicio, fin) : [];

  return {
    elementos,
    pagina: paginaCorregida,
    totalPaginas,
    totalElementos: elementosTotales,
  };
}
