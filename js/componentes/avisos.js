/**
 * Sistema de avisos y notificaciones accesibles mediante eventos personalizados.
 *
 * @module componentes/avisos
 */
import { leer, guardar, eliminar } from '../datos/almacen.js';

const CLAVE_AVISO_PENDIENTE = 'aviso_pendiente';

/**
 * Lanza un evento personalizado 'aviso' con burbujeo.
 *
 * @param {EventTarget} elemento Elemento desde donde se dispara el evento (burbujeará hasta document).
 * @param {string} mensaje Texto accesible que se mostrará.
 * @param {'success' | 'danger' | 'info' | 'warning'} [tipo='info'] Tipo de aviso para aplicar clases de Bootstrap.
 */
export function lanzarAviso(elemento, mensaje, tipo = 'info') {
  const destino = elemento || document;
  const evento = new CustomEvent('aviso', {
    bubbles: true,
    detail: { mensaje, tipo },
  });
  destino.dispatchEvent(evento);
}

/**
 * Guarda un aviso en sessionStorage para que sea mostrado en la siguiente página tras una redirección.
 *
 * @param {string} mensaje
 * @param {'success' | 'danger' | 'info' | 'warning'} [tipo='info']
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=sessionStorage]
 */
export function guardarAvisoParaSiguientePagina(mensaje, tipo = 'info', almacen = sessionStorage) {
  guardar(almacen, CLAVE_AVISO_PENDIENTE, { mensaje, tipo });
}

/**
 * Recupera y consume el aviso guardado para la página actual (lo borra tras leerlo).
 *
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=sessionStorage]
 * @returns {{ mensaje: string, tipo: string } | null}
 */
export function consumirAvisoPendiente(almacen = sessionStorage) {
  const aviso = leer(almacen, CLAVE_AVISO_PENDIENTE, null);
  if (aviso) {
    eliminar(almacen, CLAVE_AVISO_PENDIENTE);
    return aviso;
  }
  return null;
}

/**
 * Renderiza el mensaje en el contenedor con role="status" usando clases de alerta.
 *
 * @param {Document} documento
 * @param {string} mensaje
 * @param {string} tipo
 */
export function mostrarAvisoEnDOM(documento, mensaje, tipo) {
  const zona = documento.querySelector('#zona-avisos');
  if (!zona) {
    return;
  }

  // Mapear tipos a las clases de alerta planas
  const claseTipo = tipo === 'error' ? 'danger' : tipo;
  const alerta = documento.createElement('div');
  alerta.className = `alert alert-${claseTipo} alert-edgy alert-edgy-${claseTipo} mb-3`;
  alerta.setAttribute('role', 'alert');

  const texto = documento.createElement('span');
  texto.textContent = mensaje;
  alerta.appendChild(texto);

  // Botón para cerrar
  const btnCerrar = documento.createElement('button');
  btnCerrar.type = 'button';
  btnCerrar.className = 'btn-close btn-close-white ms-auto';
  btnCerrar.setAttribute('aria-label', 'Cerrar aviso');
  btnCerrar.addEventListener('click', () => alerta.remove());
  alerta.appendChild(btnCerrar);

  // Sustituir avisos anteriores para mantener la zona limpia
  zona.replaceChildren(alerta);
}

/**
 * Inicializa el sistema de avisos: registra el único oyente en document y consume avisos pendientes.
 *
 * @param {Document} [documento=document]
 * @param {Storage | import('../../tests/AlmacenFalso.js').AlmacenFalso} [almacen=sessionStorage]
 */
export function iniciarAvisos(documento = document, almacen = sessionStorage) {
  documento.addEventListener('aviso', (evento) => {
    if (evento.detail && evento.detail.mensaje) {
      mostrarAvisoEnDOM(documento, evento.detail.mensaje, evento.detail.tipo || 'info');
    }
  });

  const pendiente = consumirAvisoPendiente(almacen);
  if (pendiente) {
    lanzarAviso(documento, pendiente.mensaje, pendiente.tipo);
  }
}
