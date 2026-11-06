/**
 * Gestor del tema visual (Modo Oscuro / Modo Claro) para BeatFest Manager.
 *
 * @module componentes/tema
 */

const CLAVE_TEMA = 'beatfest_theme';

/**
 * Obtiene el tema activo almacenado o el preferido por el sistema.
 *
 * @param {Storage} [almacen=localStorage]
 * @returns {'dark' | 'light'}
 */
export function obtenerTemaActual(almacen = localStorage) {
  try {
    const temaGuardado = almacen.getItem(CLAVE_TEMA);
    if (temaGuardado === 'dark' || temaGuardado === 'light') {
      return temaGuardado;
    }
  } catch {
    // Si localStorage no está disponible
  }

  return 'dark';
}

/**
 * Aplica el tema en el elemento raíz <html> y sincroniza los botones selectores.
 *
 * @param {'dark' | 'light'} tema
 * @param {Document} [documento=document]
 * @param {Storage} [almacen=localStorage]
 */
export function aplicarTema(tema, documento = document, almacen = localStorage) {
  const raiz = documento.documentElement;
  raiz.setAttribute('data-theme', tema);

  try {
    almacen.setItem(CLAVE_TEMA, tema);
  } catch {
    // Silenciar error en entornos restringidos
  }

  // Actualizar atributos de accesibilidad en todos los botones de cambio de tema
  const botones = documento.querySelectorAll('.btn-theme-toggle');
  botones.forEach((boton) => {
    boton.setAttribute('aria-pressed', tema === 'light' ? 'true' : 'false');
    boton.setAttribute(
      'title',
      tema === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro',
    );
  });
}

/**
 * Alterna entre modo oscuro y modo claro.
 *
 * @param {Document} [documento=document]
 * @param {Storage} [almacen=localStorage]
 * @returns {'dark' | 'light'} El nuevo tema aplicado.
 */
export function conmutarTema(documento = document, almacen = localStorage) {
  const temaActual = obtenerTemaActual(almacen);
  const nuevoTema = temaActual === 'light' ? 'dark' : 'light';
  aplicarTema(nuevoTema, documento, almacen);
  return nuevoTema;
}

/**
 * Inicializa el soporte de tema y escucha eventos en los botones de conmutación.
 *
 * @param {Document} [documento=document]
 * @param {Storage} [almacen=localStorage]
 */
export function iniciarTema(documento = document, almacen = localStorage) {
  const temaInicial = obtenerTemaActual(almacen);
  aplicarTema(temaInicial, documento, almacen);

  const botones = documento.querySelectorAll('.btn-theme-toggle');
  botones.forEach((boton) => {
    // Evitar registrar múltiples oyentes
    if (!boton.dataset.temaIniciado) {
      boton.dataset.temaIniciado = 'true';
      boton.addEventListener('click', () => {
        conmutarTema(documento, almacen);
      });
    }
  });
}
