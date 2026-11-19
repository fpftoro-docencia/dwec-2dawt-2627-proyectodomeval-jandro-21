/**
 * Controlador de la página de alta y edición de jornadas (ficha.html).
 * Implementa validación en tiempo real (fase de captura de blur e input),
 * campo condicional (suplemento VIP), grupo dinámico con template (patrocinadores)
 * y lectura normalizada mediante FormData.
 *
 * @module paginas/ficha
 */
import { haySesion, obtenerUsuarioActual } from '../datos/sesion.js';
import {
  obtenerJornadaPorId,
  obtenerJornadaGlobalPorId,
  guardarJornada,
} from '../datos/jornadas.js';
import { validadores } from '../logica/validadores.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import {
  iniciarAvisos,
  lanzarAviso,
  guardarAvisoParaSiguientePagina,
} from '../componentes/avisos.js';
import { iniciarTema } from '../componentes/tema.js';

/**
 * Inicializa la página de ficha de jornada de festival.
 *
 * @param {Document} [documento=document]
 * @param {object} [opciones={}]
 * @param {Storage} [opciones.almacenSesion=sessionStorage]
 * @param {Storage} [opciones.almacenJornadas=localStorage]
 * @param {Function} [opciones.navegar]
 * @param {string|null} [opciones.idJornada=null] ID forzado para tests de integración.
 */
export function iniciarPaginaFicha(
  documento = document,
  {
    almacenSesion = sessionStorage,
    almacenJornadas = localStorage,
    navegar = (url) => location.assign(url),
    idJornada = null,
  } = {},
) {
  // 1. Protección de página privada: sin sesión redirige a index.html
  if (!haySesion(almacenSesion)) {
    navegar('index.html');
    return;
  }

  iniciarTema(documento);
  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento, { almacenSesion, navegar });

  const usuarioActual = obtenerUsuarioActual(almacenSesion);
  if (!usuarioActual) {
    navegar('index.html');
    return;
  }

  const formulario = documento.querySelector('#form-jornada');
  if (!formulario) {
    return;
  }

  const campoId = formulario.querySelector('#jornada-id');
  const campoNombre = formulario.querySelector('#campo-nombre-jornada');
  const campoFecha = formulario.querySelector('#campo-fecha-evento');
  const campoGenero = formulario.querySelector('#campo-genero-musical');
  const campoAforo = formulario.querySelector('#campo-aforo-maximo');
  const radiosTipoAcceso = formulario.querySelectorAll('input[name="tipoAcceso"]');
  const contenedorVip = formulario.querySelector('#contenedor-suplemento-vip');
  const campoSuplementoVip = formulario.querySelector('#campo-suplemento-vip');
  const campoLicencia = formulario.querySelector('#campo-codigo-licencia');
  const campoTelefono = formulario.querySelector('#campo-telefono-contacto');
  const campoCif = formulario.querySelector('#campo-cif-promotora');

  const contenedorPatrocinadores = formulario.querySelector('#contenedor-patrocinadores');
  const btnAgregarPatrocinador = formulario.querySelector('#btn-agregar-patrocinador');
  const templatePatrocinador = documento.querySelector('#tpl-patrocinador');
  const tituloPagina = documento.querySelector('#titulo-pagina-ficha');
  const btnGuardar = formulario.querySelector('#btn-guardar-jornada');

  // Requisito 17: Establecer fecha mínima dinámica (no anterior a hoy)
  const hoyISO = new Date().toISOString().split('T')[0];
  if (campoFecha) {
    campoFecha.min = hoyISO;
  }

  // Identificar si estamos en modo edición (?id=...)
  let idEdicion = idJornada;
  if (!idEdicion && typeof window !== 'undefined' && window.location && window.location.search) {
    const params = new URLSearchParams(window.location.search);
    idEdicion = params.get('id');
  }

  // 2. Gestión de grupo dinámico de patrocinadores (0 a 3)
  const MAX_PATROCINADORES = 3;

  const actualizarEstadoPatrocinadores = () => {
    if (!contenedorPatrocinadores) {
      return;
    }
    const items = contenedorPatrocinadores.querySelectorAll('.item-patrocinador');
    const cantidad = items.length;

    if (btnAgregarPatrocinador) {
      btnAgregarPatrocinador.disabled = cantidad >= MAX_PATROCINADORES;
    }

    // Renumerar etiquetas, IDs y accesibilidad
    items.forEach((item, index) => {
      const num = index + 1;
      const inputId = `campo-patrocinador-${num}`;
      const errorId = `error-patrocinador-${num}`;

      const label = item.querySelector('.label-patrocinador');
      if (label) {
        label.htmlFor = inputId;
        label.textContent = `Patrocinador ${num}`;
      }

      const input = item.querySelector('.input-patrocinador');
      if (input) {
        input.id = inputId;
        input.setAttribute('aria-describedby', errorId);
      }

      const errorBox = item.querySelector('.error-patrocinador');
      if (errorBox) {
        errorBox.id = errorId;
      }
    });
  };

  const agregarFilaPatrocinador = (valor = '') => {
    if (!contenedorPatrocinadores || !templatePatrocinador) {
      return;
    }
    const items = contenedorPatrocinadores.querySelectorAll('.item-patrocinador');
    if (items.length >= MAX_PATROCINADORES) {
      return;
    }

    const clon = templatePatrocinador.content.cloneNode(true);
    const input = clon.querySelector('.input-patrocinador');
    if (input && valor) {
      input.value = valor;
    }

    contenedorPatrocinadores.appendChild(clon);
    actualizarEstadoPatrocinadores();
  };

  // Delegación de eventos para eliminar patrocinadores dinámicos
  if (contenedorPatrocinadores) {
    contenedorPatrocinadores.addEventListener('click', (evento) => {
      const btnQuitar = evento.target.closest('.btn-quitar-patrocinador');
      if (!btnQuitar) {
        return;
      }
      const item = btnQuitar.closest('.item-patrocinador');
      if (item) {
        item.remove();
        actualizarEstadoPatrocinadores();
      }
    });
  }

  if (btnAgregarPatrocinador) {
    btnAgregarPatrocinador.addEventListener('click', () => {
      agregarFilaPatrocinador();
    });
  }

  // 3. Gestión de campo condicional: Suplemento VIP
  const actualizarVisibilidadCampoVip = () => {
    let tipoSeleccionado = 'general';
    radiosTipoAcceso.forEach((radio) => {
      if (radio.checked) {
        tipoSeleccionado = radio.value;
      }
    });

    const esVip = tipoSeleccionado === 'vip';
    if (contenedorVip && campoSuplementoVip) {
      contenedorVip.hidden = !esVip;
      campoSuplementoVip.disabled = !esVip;
      if (!esVip) {
        campoSuplementoVip.classList.remove('is-invalid');
        campoSuplementoVip.removeAttribute('aria-invalid');
        const cajaError = documento.querySelector('#error-suplemento-vip');
        if (cajaError) {
          cajaError.textContent = '';
        }
      }
    }
  };

  radiosTipoAcceso.forEach((radio) => {
    radio.addEventListener('change', actualizarVisibilidadCampoVip);
  });

  const esAdmin = usuarioActual.rol === 'administrador';
  let propietarioJornada = usuarioActual.nombre;

  // 4. Modo Edición: Cargar datos existentes si viene id
  if (idEdicion) {
    let jornadaExistente = obtenerJornadaPorId(usuarioActual.nombre, idEdicion, almacenJornadas);
    if (!jornadaExistente && esAdmin) {
      jornadaExistente = obtenerJornadaGlobalPorId(idEdicion, almacenJornadas);
    }

    if (!jornadaExistente) {
      // Requisito 17: Con un id que no existe, vuelve al listado con aviso de error
      guardarAvisoParaSiguientePagina(
        'La jornada indicada no existe o no tienes permiso para editarla',
        'danger',
        almacenSesion,
      );
      navegar('listado.html');
      return;
    }

    propietarioJornada = jornadaExistente.propietario || usuarioActual.nombre;

    const campoPropietario = formulario.querySelector('#jornada-propietario');
    if (campoPropietario) {
      campoPropietario.value = propietarioJornada;
    }

    // Aviso al administrador cuando edita el festival de otro promotor
    if (esAdmin && propietarioJornada.toLowerCase() !== usuarioActual.nombre.toLowerCase()) {
      lanzarAviso(
        formulario,
        `Modo Administrador: Editando jornada del promotor @${propietarioJornada}`,
        'warning',
      );
    }

    // Rellenar formulario con los datos recuperados
    if (campoId) {
      campoId.value = jornadaExistente.id;
    }
    if (campoNombre) {
      campoNombre.value = jornadaExistente.nombreJornada || '';
    }
    if (campoFecha) {
      campoFecha.value = jornadaExistente.fechaEvento || '';
    }
    if (campoGenero) {
      campoGenero.value = jornadaExistente.generoMusical || '';
    }
    if (campoAforo) {
      campoAforo.value = jornadaExistente.aforoMaximo || '';
    }
    if (campoLicencia) {
      campoLicencia.value = jornadaExistente.codigoLicencia || '';
    }
    if (campoTelefono) {
      campoTelefono.value = jornadaExistente.telefonoContacto || '';
    }
    if (campoCif) {
      campoCif.value = jornadaExistente.cifPromotora || '';
    }

    radiosTipoAcceso.forEach((radio) => {
      radio.checked = radio.value === jornadaExistente.tipoAcceso;
    });

    actualizarVisibilidadCampoVip();
    if (jornadaExistente.tipoAcceso === 'vip' && campoSuplementoVip) {
      campoSuplementoVip.value =
        jornadaExistente.suplementoVip !== null && jornadaExistente.suplementoVip !== undefined
          ? jornadaExistente.suplementoVip
          : '';
    }

    // Rellenar patrocinadores dinámicos
    if (contenedorPatrocinadores) {
      contenedorPatrocinadores.innerHTML = '';
      if (Array.isArray(jornadaExistente.patrocinadores)) {
        jornadaExistente.patrocinadores.forEach((p) => agregarFilaPatrocinador(p));
      }
    }

    if (tituloPagina) {
      tituloPagina.textContent = 'Editar Jornada';
    }
    if (btnGuardar) {
      btnGuardar.textContent = 'Guardar Cambios';
    }
  }

  // 5. Validación en tiempo real (Requisitos 19 y 20)
  const obtenerCajaError = (campo) => {
    const errorId = campo.getAttribute('aria-describedby');
    if (errorId) {
      const caja = documento.getElementById(errorId);
      if (caja) {
        return caja;
      }
    }
    const contenedor = campo.closest('.item-patrocinador') || campo.parentElement;
    return contenedor ? contenedor.querySelector('.invalid-feedback') : null;
  };

  const marcarError = (campo, mensaje) => {
    campo.classList.add('is-invalid');
    campo.setAttribute('aria-invalid', 'true');
    const caja = obtenerCajaError(campo);
    if (caja) {
      caja.textContent = mensaje;
    }
  };

  const limpiarError = (campo) => {
    campo.classList.remove('is-invalid');
    campo.removeAttribute('aria-invalid');
    const caja = obtenerCajaError(campo);
    if (caja) {
      caja.textContent = '';
    }
  };

  const validarCampo = (campo) => {
    if (!campo || campo.disabled || campo.type === 'hidden') {
      return true;
    }

    const regla = campo.dataset.validar;
    if (!regla) {
      return true;
    }

    const funcionValidadora = validadores[regla];
    if (typeof funcionValidadora !== 'function') {
      return true;
    }

    const valor = campo.value;
    const resultado = funcionValidadora(valor);

    if (!resultado.valido) {
      marcarError(campo, resultado.motivo);
      return false;
    }

    limpiarError(campo);
    return true;
  };

  // Requisito 20: Fase de captura para escuchar 'blur' en el formulario
  formulario.addEventListener(
    'blur',
    (evento) => {
      const target = evento.target;
      if (target && target.dataset && target.dataset.validar) {
        validarCampo(target);
      }
    },
    true, // useCapture = true
  );

  // Validación reactiva en 'input' cuando el usuario ya ha cometido un error
  formulario.addEventListener('input', (evento) => {
    const target = evento.target;
    if (target && target.classList.contains('is-invalid')) {
      validarCampo(target);
    }
  });

  // 6. Envío del formulario
  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    // Validar todos los campos activos
    const camposAValidar = Array.from(formulario.querySelectorAll('[data-validar]:not(:disabled)'));

    let primerCampoConError = null;
    let formularioValido = true;

    camposAValidar.forEach((campo) => {
      const valido = validarCampo(campo);
      if (!valido) {
        formularioValido = false;
        if (!primerCampoConError) {
          primerCampoConError = campo;
        }
      }
    });

    if (!formularioValido) {
      if (primerCampoConError) {
        primerCampoConError.focus();
      }
      lanzarAviso(
        formulario,
        'Por favor, corrige los campos erróneos antes de continuar',
        'danger',
      );
      return;
    }

    // Requisito 17: Lectura de datos con FormData
    const formData = new FormData(formulario);
    const tipoAcceso = formData.get('tipoAcceso') || 'general';
    const suplementoRaw = formData.get('suplementoVip');

    const patrocinadores = formData
      .getAll('patrocinadores')
      .map((p) => String(p).trim())
      .filter((p) => p.length > 0);

    const campoPropietario = formulario.querySelector('#jornada-propietario');
    const propietarioFinal =
      (campoPropietario && campoPropietario.value) || propietarioJornada || usuarioActual.nombre;

    const jornadaData = {
      nombreJornada: String(formData.get('nombreJornada') || '').trim(),
      fechaEvento: String(formData.get('fechaEvento') || ''),
      generoMusical: String(formData.get('generoMusical') || ''),
      aforoMaximo: parseInt(formData.get('aforoMaximo'), 10),
      tipoAcceso,
      suplementoVip: tipoAcceso === 'vip' ? parseFloat(suplementoRaw) : null,
      codigoLicencia: String(formData.get('codigoLicencia') || '')
        .trim()
        .toUpperCase(),
      telefonoContacto: String(formData.get('telefonoContacto') || '').trim(),
      cifPromotora: String(formData.get('cifPromotora') || '')
        .trim()
        .toUpperCase(),
      patrocinadores,
      propietario: propietarioFinal,
    };

    const idGuardado = campoId ? campoId.value : null;
    if (idGuardado) {
      jornadaData.id = idGuardado;
    }

    guardarJornada(propietarioFinal, jornadaData, almacenJornadas);

    const mensajeExito = idGuardado
      ? 'Jornada modificada con éxito en el cartel'
      : 'Nueva jornada añadida al cartel del festival';

    guardarAvisoParaSiguientePagina(mensajeExito, 'success', almacenSesion);
    navegar('listado.html');
  });
}

// Auto-arranque en navegador
if (typeof window !== 'undefined' && document.querySelector('#form-jornada')) {
  iniciarPaginaFicha(document);
}
