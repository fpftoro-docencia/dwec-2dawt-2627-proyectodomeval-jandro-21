/**
 * Controlador de la página de registro de promotores (registro.html).
 *
 * @module paginas/registro
 */
import { haySesion, iniciarSesion } from '../datos/sesion.js';
import {
  registrarUsuario,
  buscarUsuarioPorNombre,
  buscarUsuarioPorCorreo,
} from '../datos/usuarios.js';
import { resumirClave } from '../clave.js';
import {
  validarNombreUsuario,
  validarCorreo,
  comprobarRequisitosClave,
  validarClave,
  validarRepeticionClave,
  validarTerminos,
} from '../logica/validadores.js';
import { iniciarAvisos, lanzarAviso, guardarAvisoParaSiguientePagina } from '../componentes/avisos.js';

const SVG_CHECK = `<svg class="svg-req" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 10l3 3 6-6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SVG_CIRCLE = `<svg class="svg-req" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" stroke-width="2"/></svg>`;

/**
 * Inicializa la página de registro.
 *
 * @param {Document} [documento=document]
 * @param {object} [opciones={}]
 * @param {Storage} [opciones.almacenUsuarios=localStorage]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {Function} [opciones.resumir=resumirClave]
 * @param {(url: string) => void} [opciones.navegar=(url) => location.replace(url)]
 */
export function iniciarPaginaRegistro(
  documento = document,
  {
    almacenUsuarios = localStorage,
    almacenSesion = sessionStorage,
    resumir = resumirClave,
    navegar = (url) => location.replace(url),
  } = {}
) {
  if (haySesion(almacenSesion)) {
    navegar('listado.html');
    return;
  }

  iniciarAvisos(documento, almacenSesion);

  const formulario = documento.querySelector('#form-registro');
  if (!formulario) {
    return;
  }

  const campoNombre = formulario.elements.nombre;
  const campoCorreo = formulario.elements.correo;
  const campoClave = formulario.elements.clave;
  const campoRepetir = formulario.elements.repetirClave;
  const campoTerminos = formulario.elements.aceptarTerminos;
  const btnEnviar = formulario.querySelector('#btn-registro-enviar');

  // Elementos de la lista de requisitos visuales
  const reqLongitud = documento.querySelector('#req-longitud');
  const reqMinuscula = documento.querySelector('#req-minuscula');
  const reqMayuscula = documento.querySelector('#req-mayuscula');
  const reqCifra = documento.querySelector('#req-cifra');

  let enviando = false;

  // Actualización en tiempo real de los requisitos de la contraseña mientras se escribe
  campoClave.addEventListener('input', () => {
    const estado = comprobarRequisitosClave(campoClave.value);

    const actualizarItem = (el, cumplido, texto) => {
      if (!el) {
        return;
      }
      if (cumplido) {
        el.classList.add('cumplido');
        el.innerHTML = `${SVG_CHECK}<span>${texto}</span>`;
      } else {
        el.classList.remove('cumplido');
        el.innerHTML = `${SVG_CIRCLE}<span>${texto}</span>`;
      }
    };

    actualizarItem(reqLongitud, estado.longitud, 'Mínimo 8 caracteres de longitud');
    actualizarItem(reqMinuscula, estado.minuscula, 'Al menos una letra minúscula');
    actualizarItem(reqMayuscula, estado.mayuscula, 'Al menos una letra mayúscula');
    actualizarItem(reqCifra, estado.cifra, 'Al menos un número (0-9)');

    // Si ya se había escrito en repetir clave, revalidar correspondencia
    if (campoRepetir.value) {
      validarCampoRepetir();
    }
  });

  const marcarError = (campo, idError, mensaje) => {
    campo.classList.add('is-invalid');
    campo.setAttribute('aria-invalid', 'true');
    const caja = documento.querySelector(idError);
    if (caja) {
      caja.textContent = mensaje;
    }
  };

  const limpiarError = (campo, idError) => {
    campo.classList.remove('is-invalid');
    campo.removeAttribute('aria-invalid');
    const caja = documento.querySelector(idError);
    if (caja) {
      caja.textContent = '';
    }
  };

  const validarCampoNombre = () => {
    const res = validarNombreUsuario(campoNombre.value);
    if (!res.valido) {
      marcarError(campoNombre, '#error-registro-nombre', res.motivo);
      return false;
    }
    if (buscarUsuarioPorNombre(campoNombre.value, almacenUsuarios)) {
      marcarError(campoNombre, '#error-registro-nombre', 'Este nombre de usuario ya está ocupado');
      return false;
    }
    limpiarError(campoNombre, '#error-registro-nombre');
    return true;
  };

  const validarCampoCorreo = () => {
    const res = validarCorreo(campoCorreo.value);
    if (!res.valido) {
      marcarError(campoCorreo, '#error-registro-correo', res.motivo);
      return false;
    }
    if (buscarUsuarioPorCorreo(campoCorreo.value, almacenUsuarios)) {
      marcarError(campoCorreo, '#error-registro-correo', 'Este correo ya está registrado');
      return false;
    }
    limpiarError(campoCorreo, '#error-registro-correo');
    return true;
  };

  const validarCampoClave = () => {
    const res = validarClave(campoClave.value);
    if (!res.valido) {
      marcarError(campoClave, '#error-registro-clave', res.motivo);
      return false;
    }
    limpiarError(campoClave, '#error-registro-clave');
    return true;
  };

  const validarCampoRepetir = () => {
    const res = validarRepeticionClave(campoClave.value, campoRepetir.value);
    if (!res.valido) {
      marcarError(campoRepetir, '#error-registro-repetir-clave', res.motivo);
      return false;
    }
    limpiarError(campoRepetir, '#error-registro-repetir-clave');
    return true;
  };

  const validarCampoTerminos = () => {
    const res = validarTerminos(campoTerminos.checked);
    if (!res.valido) {
      marcarError(campoTerminos, '#error-registro-terminos', res.motivo);
      return false;
    }
    limpiarError(campoTerminos, '#error-registro-terminos');
    return true;
  };

  // Requisito 20: Captura de eventos blur en el formulario (blur no sube por burbuja)
  formulario.addEventListener(
    'blur',
    (evento) => {
      const target = evento.target;
      if (target === campoNombre) {
        validarCampoNombre();
      } else if (target === campoCorreo) {
        validarCampoCorreo();
      } else if (target === campoClave) {
        validarCampoClave();
      } else if (target === campoRepetir) {
        validarCampoRepetir();
      }
    },
    true
  );

  // Validación reactiva con input una vez que el usuario ya ha interactuado
  campoNombre.addEventListener('input', () => {
    if (campoNombre.classList.contains('is-invalid')) {
      validarCampoNombre();
    }
  });
  campoCorreo.addEventListener('input', () => {
    if (campoCorreo.classList.contains('is-invalid')) {
      validarCampoCorreo();
    }
  });
  campoRepetir.addEventListener('input', () => {
    if (campoRepetir.classList.contains('is-invalid')) {
      validarCampoRepetir();
    }
  });
  campoTerminos.addEventListener('change', validarCampoTerminos);

  // Envío del formulario
  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    if (enviando) {
      return;
    }

    const esNombreValido = validarCampoNombre();
    const esCorreoValido = validarCampoCorreo();
    const esClaveValida = validarCampoClave();
    const esRepetirValido = validarCampoRepetir();
    const sonTerminosValidos = validarCampoTerminos();

    // Requisito: Si hay errores, el foco va al primer campo con error
    if (!esNombreValido) {
      campoNombre.focus();
      lanzarAviso(formulario, 'Corrige los errores del formulario para continuar', 'danger');
      return;
    }
    if (!esCorreoValido) {
      campoCorreo.focus();
      lanzarAviso(formulario, 'Corrige los errores del formulario para continuar', 'danger');
      return;
    }
    if (!esClaveValida) {
      campoClave.focus();
      lanzarAviso(formulario, 'La contraseña no cumple con los requisitos de seguridad', 'danger');
      return;
    }
    if (!esRepetirValido) {
      campoRepetir.focus();
      lanzarAviso(formulario, 'Las contraseñas deben ser idénticas', 'danger');
      return;
    }
    if (!sonTerminosValidos) {
      campoTerminos.focus();
      lanzarAviso(formulario, 'Debes aceptar las condiciones del servicio', 'danger');
      return;
    }

    try {
      enviando = true;
      if (btnEnviar) {
        btnEnviar.setAttribute('disabled', 'true');
      }

      const usuario = await registrarUsuario(
        {
          nombre: campoNombre.value.trim(),
          correo: campoCorreo.value.trim(),
          clave: campoClave.value,
        },
        almacenUsuarios,
        resumir
      );

      // Entra con la sesión iniciada automáticamente
      iniciarSesion(usuario, almacenSesion);

      // Deja un aviso para la siguiente página y va al listado
      const mensajeBienvenida =
        usuario.rol === 'administrador'
          ? `¡Cuenta creada con éxito! Eres el Administrador Principal de BeatFest.`
          : `¡Cuenta creada con éxito! Bienvenido al cartel de BeatFest.`;

      guardarAvisoParaSiguientePagina(mensajeBienvenida, 'success', almacenSesion);
      navegar('listado.html');
    } catch (error) {
      lanzarAviso(formulario, error.message || 'Error al registrar la cuenta', 'danger');
    } finally {
      enviando = false;
      if (btnEnviar) {
        btnEnviar.removeAttribute('disabled');
      }
    }
  });
}

// Auto-arranque en navegador
if (typeof window !== 'undefined' && document.querySelector('#form-registro')) {
  iniciarPaginaRegistro(document);
}
