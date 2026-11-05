/**
 * Controlador de la página de inicio de sesión (index.html).
 *
 * @module paginas/login
 */
import { haySesion, iniciarSesion } from '../datos/sesion.js';
import { verificarCredenciales } from '../datos/usuarios.js';
import { resumirClave } from '../clave.js';
import {
  iniciarAvisos,
  lanzarAviso,
  guardarAvisoParaSiguientePagina,
} from '../componentes/avisos.js';

/**
 * Inicializa la página de inicio de sesión.
 *
 * @param {Document} [documento=document]
 * @param {object} [opciones={}]
 * @param {Storage} [opciones.almacenUsuarios=localStorage]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {Function} [opciones.resumir=resumirClave]
 * @param {(url: string) => void} [opciones.navegar=(url) => location.replace(url)]
 */
export function iniciarPaginaLogin(
  documento = document,
  {
    almacenUsuarios = localStorage,
    almacenSesion = sessionStorage,
    resumir = resumirClave,
    navegar = (url) => location.replace(url),
  } = {},
) {
  // Si ya hay sesión activa, redirige inmediatamente al listado
  if (haySesion(almacenSesion)) {
    navegar('listado.html');
    return;
  }

  iniciarAvisos(documento, almacenSesion);

  const formulario = documento.querySelector('#form-login');
  if (!formulario) {
    return;
  }

  const campoNombre = formulario.elements.nombre;
  const campoClave = formulario.elements.clave;
  const btnEnviar = formulario.querySelector('#btn-login-enviar');

  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    // Bloqueo de doble envío mientras se procesa la solicitud
    if (enviando) {
      return;
    }

    const nombre = campoNombre.value.trim();
    const clave = campoClave.value;

    if (!nombre) {
      campoNombre.classList.add('is-invalid');
      const err = documento.querySelector('#error-login-nombre');
      if (err) {
        err.textContent = 'Introduce tu nombre de usuario';
      }
      campoNombre.focus();
      lanzarAviso(formulario, 'Por favor, introduce tu nombre de usuario', 'danger');
      return;
    }
    campoNombre.classList.remove('is-invalid');

    if (!clave) {
      campoClave.classList.add('is-invalid');
      const err = documento.querySelector('#error-login-clave');
      if (err) {
        err.textContent = 'Introduce tu contraseña';
      }
      campoClave.focus();
      lanzarAviso(formulario, 'Por favor, introduce tu contraseña', 'danger');
      return;
    }
    campoClave.classList.remove('is-invalid');

    try {
      enviando = true;
      if (btnEnviar) {
        btnEnviar.setAttribute('disabled', 'true');
      }

      const usuario = await verificarCredenciales(nombre, clave, almacenUsuarios, resumir);

      if (!usuario) {
        // Contraseña incorrecta: avisa, vacía la contraseña y le da el foco
        campoClave.value = '';
        campoClave.classList.add('is-invalid');
        const err = documento.querySelector('#error-login-clave');
        if (err) {
          err.textContent = 'Contraseña incorrecta o usuario no encontrado';
        }
        campoClave.focus();
        lanzarAviso(formulario, 'Usuario o contraseña incorrectos', 'danger');
        return;
      }

      // Inicio de sesión exitoso
      iniciarSesion(usuario, almacenSesion);
      guardarAvisoParaSiguientePagina(
        `¡Bienvenido de nuevo a BeatFest, ${usuario.nombre}!`,
        'success',
        almacenSesion,
      );
      navegar('listado.html');
    } finally {
      enviando = false;
      if (btnEnviar) {
        btnEnviar.removeAttribute('disabled');
      }
    }
  });
}

// Auto-arranque en navegador
if (typeof window !== 'undefined' && document.querySelector('#form-login')) {
  iniciarPaginaLogin(document);
}
