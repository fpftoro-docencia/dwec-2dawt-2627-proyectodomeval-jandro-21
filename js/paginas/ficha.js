/**
 * Controlador de la página de alta y edición de jornadas (ficha.html).
 *
 * @module paginas/ficha
 */
import { haySesion } from '../datos/sesion.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarAvisos } from '../componentes/avisos.js';

/**
 * Inicializa la página de ficha de festival.
 *
 * @param {Document} [documento=document]
 * @param {object} [opciones={}]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {(url: string) => void} [opciones.navegar=(url) => location.replace(url)]
 */
export function iniciarPaginaFicha(
  documento = document,
  { almacenSesion = sessionStorage, navegar = (url) => location.replace(url) } = {}
) {
  // Protección de página privada: sin sesión redirige a index.html
  if (!haySesion(almacenSesion)) {
    navegar('index.html');
    return;
  }

  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento, { almacenSesion, navegar });
}

// Auto-arranque en navegador
if (typeof window !== 'undefined' && document.querySelector('#cabecera-usuario')) {
  iniciarPaginaFicha(document);
}
