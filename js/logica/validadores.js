/**
 * Funciones puras de validación de usuarios y contraseñas.
 * Sin DOM ni efectos secundarios (fáciles de probar y con cobertura del 100%).
 *
 * @module logica/validadores
 */

/**
 * Valida un nombre de usuario.
 * Debe tener entre 3 y 20 caracteres y contener solo letras, números, guiones y guiones bajos.
 *
 * @param {string} nombre
 * @returns {{ valido: boolean, motivo: string }}
 */
export function validarNombreUsuario(nombre) {
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    return { valido: false, motivo: 'El nombre de usuario es obligatorio' };
  }
  const valor = nombre.trim();
  if (valor.length < 3) {
    return { valido: false, motivo: 'El nombre debe tener al menos 3 caracteres' };
  }
  if (valor.length > 20) {
    return { valido: false, motivo: 'El nombre no puede tener más de 20 caracteres' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(valor)) {
    return {
      valido: false,
      motivo: 'Solo se permiten letras sin tilde, números, guiones y guiones bajos',
    };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida el formato de una dirección de correo electrónico.
 *
 * @param {string} correo
 * @returns {{ valido: boolean, motivo: string }}
 */
export function validarCorreo(correo) {
  if (typeof correo !== 'string' || correo.trim().length === 0) {
    return { valido: false, motivo: 'El correo electrónico es obligatorio' };
  }
  const valor = correo.trim();
  const regexCorreo = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexCorreo.test(valor)) {
    return { valido: false, motivo: 'Introduce un formato de correo electrónico válido' };
  }
  return { valido: true, motivo: '' };
}

/**
 * Evalúa los cuatro requisitos de seguridad de una contraseña en tiempo real.
 * Utiliza Unicode property escapes (\p{Ll} y \p{Lu}) para letras minúsculas y mayúsculas.
 *
 * @param {string} clave
 * @returns {{
 *   longitud: boolean,
 *   minuscula: boolean,
 *   mayuscula: boolean,
 *   cifra: boolean,
 *   valida: boolean
 * }}
 */
export function comprobarRequisitosClave(clave) {
  if (typeof clave !== 'string') {
    return {
      longitud: false,
      minuscula: false,
      mayuscula: false,
      cifra: false,
      valida: false,
    };
  }

  const longitud = clave.length >= 8;
  const minuscula = /\p{Ll}/u.test(clave);
  const mayuscula = /\p{Lu}/u.test(clave);
  const cifra = /\d/.test(clave);

  return {
    longitud,
    minuscula,
    mayuscula,
    cifra,
    valida: longitud && minuscula && mayuscula && cifra,
  };
}

/**
 * Valida una contraseña comprobando que cumpla todos los requisitos.
 *
 * @param {string} clave
 * @returns {{ valido: boolean, motivo: string }}
 */
export function validarClave(clave) {
  const req = comprobarRequisitosClave(clave);
  if (req.valida) {
    return { valido: true, motivo: '' };
  }
  if (!req.longitud) {
    return { valido: false, motivo: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (!req.minuscula) {
    return { valido: false, motivo: 'Debe contener al menos una letra minúscula' };
  }
  if (!req.mayuscula) {
    return { valido: false, motivo: 'Debe contener al menos una letra mayúscula' };
  }
  if (!req.cifra) {
    return { valido: false, motivo: 'Debe contener al menos un número' };
  }
  return { valido: false, motivo: 'La contraseña no cumple los requisitos' };
}

/**
 * Valida que la repetición de contraseña coincida exactamente con la original.
 *
 * @param {string} clave
 * @param {string} repetirClave
 * @returns {{ valido: boolean, motivo: string }}
 */
export function validarRepeticionClave(clave, repetirClave) {
  if (!repetirClave) {
    return { valido: false, motivo: 'Debes repetir la contraseña' };
  }
  if (clave !== repetirClave) {
    return { valido: false, motivo: 'Las contraseñas no coinciden' };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida la casilla de aceptación de términos del servicio.
 *
 * @param {boolean} aceptado
 * @returns {{ valido: boolean, motivo: string }}
 */
export function validarTerminos(aceptado) {
  if (aceptado !== true) {
    return { valido: false, motivo: 'Debes aceptar los términos y condiciones' };
  }
  return { valido: true, motivo: '' };
}
