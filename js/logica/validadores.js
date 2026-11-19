/**
 * Funciones puras de validación de usuarios y jornadas de festival.
 * Sin DOM ni efectos secundarios (fáciles de probar y con cobertura > 90%).
 *
 * @module logica/validadores
 */

/**
 * Valida un nombre de usuario.
 * Debe tener entre 3 y 20 caracteres y contener solo letras, números, guiones y guiones bajos.
 *
 * @param {string} nombre
 * @returns {{ valido: boolean, motivo: string }}
 * @example
 * validarNombreUsuario('alex_99'); // { valido: true, motivo: '' }
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
 * @example
 * validarCorreo('promotor@beatfest.es'); // { valido: true, motivo: '' }
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

/* ==========================================================================
   VALIDADORES DE LA ENTIDAD: JORNADA DE FESTIVAL (SPRINT 2)
   ========================================================================== */

/**
 * Valida el nombre de la jornada de festival.
 * Longitud entre 4 y 40 caracteres alfanuméricos con espacios y signos permitidos.
 *
 * @param {string} nombre
 * @returns {{ valido: boolean, motivo: string }}
 * @example
 * validarNombreJornada('Opening Night 2026'); // { valido: true, motivo: '' }
 */
export function validarNombreJornada(nombre) {
  if (typeof nombre !== 'string' || nombre.trim().length === 0) {
    return { valido: false, motivo: 'El nombre de la jornada es obligatorio' };
  }
  const valor = nombre.trim();
  if (valor.length < 4) {
    return { valido: false, motivo: 'El nombre debe tener al menos 4 caracteres' };
  }
  if (valor.length > 40) {
    return { valido: false, motivo: 'El nombre no puede tener más de 40 caracteres' };
  }
  if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,'&/()-]+$/.test(valor)) {
    return {
      valido: false,
      motivo: 'El nombre contiene caracteres no permitidos',
    };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida la fecha del evento.
 * Formato YYYY-MM-DD y fecha igual o posterior al día actual.
 *
 * @param {string} fechaStr
 * @param {Date} [fechaReferencia=new Date()] Fecha base de comparación (inyección para tests).
 * @returns {{ valido: boolean, motivo: string }}
 * @example
 * validarFechaEvento('2027-08-15'); // { valido: true, motivo: '' }
 */
export function validarFechaEvento(fechaStr, fechaReferencia = new Date()) {
  if (typeof fechaStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    return { valido: false, motivo: 'Introduce una fecha en formato AAAA-MM-DD' };
  }

  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);

  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
    return { valido: false, motivo: 'La fecha introducida no existe en el calendario' };
  }

  const hoy = new Date(
    fechaReferencia.getFullYear(),
    fechaReferencia.getMonth(),
    fechaReferencia.getDate(),
  );

  if (fecha < hoy) {
    return { valido: false, motivo: 'La fecha no puede ser anterior a hoy' };
  }

  return { valido: true, motivo: '' };
}

/**
 * Valida la selección del género musical principal.
 *
 * @param {string} genero
 * @returns {{ valido: boolean, motivo: string }}
 */
export function validarGeneroMusical(genero) {
  const generosPermitidos = ['rock', 'electronic', 'indie', 'metal', 'urban', 'pop'];
  if (typeof genero !== 'string' || !generosPermitidos.includes(genero.trim().toLowerCase())) {
    return { valido: false, motivo: 'Selecciona un género musical principal válido' };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida el aforo máximo de la jornada.
 * Debe ser un número entero comprendido entre 50 y 100.000 asistentes.
 *
 * @param {number|string} aforo
 * @returns {{ valido: boolean, motivo: string }}
 * @example
 * validarAforoMaximo(15000); // { valido: true, motivo: '' }
 */
export function validarAforoMaximo(aforo) {
  const num = Number(aforo);
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    return { valido: false, motivo: 'El aforo debe ser un número entero' };
  }
  if (num < 50) {
    return { valido: false, motivo: 'El aforo mínimo permitido es de 50 asistentes' };
  }
  if (num > 100000) {
    return { valido: false, motivo: 'El aforo máximo permitido es de 100.000 asistentes' };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida el tipo de acceso al recinto.
 *
 * @param {string} tipo
 * @returns {{ valido: boolean, motivo: string }}
 */
export function validarTipoAcceso(tipo) {
  const tiposValidos = ['general', 'vip', 'barra_libre'];
  if (typeof tipo !== 'string' || !tiposValidos.includes(tipo.trim().toLowerCase())) {
    return { valido: false, motivo: 'Debes seleccionar un tipo de acceso válido' };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida el suplemento VIP (campo condicional cuando tipoAcceso === 'vip').
 *
 * @param {number|string} importe
 * @returns {{ valido: boolean, motivo: string }}
 * @example
 * validarSuplementoVip(25.5); // { valido: true, motivo: '' }
 */
export function validarSuplementoVip(importe) {
  if (importe === '' || importe === null || importe === undefined) {
    return { valido: false, motivo: 'El suplemento VIP es obligatorio' };
  }
  const num = Number(importe);
  if (Number.isNaN(num) || num < 0) {
    return { valido: false, motivo: 'El suplemento VIP debe ser un importe mayor o igual a 0' };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida un patrocinador del grupo dinámico.
 *
 * @param {string} patrocinador
 * @returns {{ valido: boolean, motivo: string }}
 */
export function validarPatrocinador(patrocinador) {
  if (typeof patrocinador !== 'string' || patrocinador.trim().length === 0) {
    return { valido: false, motivo: 'El nombre del patrocinador no puede estar vacío' };
  }
  const valor = patrocinador.trim();
  if (valor.length < 2) {
    return { valido: false, motivo: 'El patrocinador debe tener al menos 2 caracteres' };
  }
  if (valor.length > 30) {
    return { valido: false, motivo: 'El patrocinador no puede superar los 30 caracteres' };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida el código de licencia del festival mediante expresión regular.
 * Formato requerido: FEST-AAAA-XXXX (4 cifras de año y 4 alfanuméricos en mayúscula).
 *
 * @param {string} codigo
 * @returns {{ valido: boolean, motivo: string }}
 * @example
 * validarCodigoLicencia('FEST-2026-ROCK'); // { valido: true, motivo: '' }
 */
export function validarCodigoLicencia(codigo) {
  if (typeof codigo !== 'string' || codigo.trim().length === 0) {
    return { valido: false, motivo: 'El código de licencia es obligatorio' };
  }
  const valor = codigo.trim();
  const regex = /^FEST-\d{4}-[A-Z0-9]{4}$/;
  if (!regex.test(valor)) {
    return {
      valido: false,
      motivo: 'Formato de licencia inválido. Debe ser FEST-AAAA-XXXX (ej: FEST-2026-ROCK)',
    };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida un número de teléfono móvil de contacto en España.
 * Expresión regular: 9 dígitos comenzando por 6 o 7.
 *
 * @param {string} tel
 * @returns {{ valido: boolean, motivo: string }}
 * @example
 * validarTelefonoContacto('612345678'); // { valido: true, motivo: '' }
 */
export function validarTelefonoContacto(tel) {
  if (typeof tel !== 'string' || tel.trim().length === 0) {
    return { valido: false, motivo: 'El teléfono de contacto es obligatorio' };
  }
  const valor = tel.trim().replace(/\s+/g, '');
  const regex = /^[67]\d{8}$/;
  if (!regex.test(valor)) {
    return {
      valido: false,
      motivo: 'Debe ser un teléfono móvil español válido (9 dígitos comenzando por 6 o 7)',
    };
  }
  return { valido: true, motivo: '' };
}

/**
 * Valida el identificador fiscal (CIF o DNI/NIE) de la promotora organizadora.
 * Combina expresión regular de formato con algoritmo de verificación de control:
 * - DNI/NIE: Módulo 23 de los 8 dígitos numéricos frente a tabla oficial TRWAGMYFPDXBNJZSQVHLCKE.
 * - CIF: Algoritmo de control español de empresas (suma par + suma de dígitos impar*2).
 *
 * @param {string} identificador
 * @returns {{ valido: boolean, motivo: string }}
 * @example
 * validarCifPromotora('12345678Z'); // Comprueba letra oficial
 * validarCifPromotora('B12345674'); // Comprueba dígito de control CIF
 */
export function validarCifPromotora(identificador) {
  if (typeof identificador !== 'string' || identificador.trim().length === 0) {
    return { valido: false, motivo: 'El identificador fiscal (CIF/DNI) es obligatorio' };
  }

  const valor = identificador.trim().toUpperCase();

  // Comprobar DNI: 8 dígitos + letra
  if (/^[0-9]{8}[A-Z]$/.test(valor)) {
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const numero = parseInt(valor.slice(0, 8), 10);
    const letraEsperada = letras[numero % 23];
    if (valor[8] !== letraEsperada) {
      return {
        valido: false,
        motivo: `DNI no válido: la letra correcta para ese número es ${letraEsperada}`,
      };
    }
    return { valido: true, motivo: '' };
  }

  // Comprobar NIE: X, Y, Z + 7 dígitos + letra
  if (/^[XYZ][0-9]{7}[A-Z]$/.test(valor)) {
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let prefijo = '0';
    if (valor[0] === 'Y') {
      prefijo = '1';
    } else if (valor[0] === 'Z') {
      prefijo = '2';
    }
    const numero = parseInt(`${prefijo}${valor.slice(1, 8)}`, 10);
    const letraEsperada = letras[numero % 23];
    if (valor[8] !== letraEsperada) {
      return {
        valido: false,
        motivo: `NIE no válido: la letra calculada correcta es ${letraEsperada}`,
      };
    }
    return { valido: true, motivo: '' };
  }

  // Comprobar CIF de empresa: 1 letra inicial + 7 dígitos + 1 carácter de control (dígito o letra)
  if (/^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(valor)) {
    const letraInicial = valor[0];
    const digitos = valor.slice(1, 8);
    const caracterControl = valor[8];

    let sumaPares = 0;
    let sumaImpares = 0;

    for (let i = 0; i < digitos.length; i += 1) {
      const d = parseInt(digitos[i], 10);
      if (i % 2 === 1) {
        // Posición par (índices 1, 3, 5 en base 0 -> posiciones 2, 4, 6)
        sumaPares += d;
      } else {
        // Posición impar (índices 0, 2, 4, 6 en base 0 -> posiciones 1, 3, 5, 7)
        const doble = d * 2;
        sumaImpares += Math.floor(doble / 10) + (doble % 10);
      }
    }

    const sumaTotal = sumaPares + sumaImpares;
    const digitoControlCalculado = (10 - (sumaTotal % 10)) % 10;
    const letrasControl = 'JABCDEFGHI';
    const letraControlCalculada = letrasControl[digitoControlCalculado];

    const soloLetra = ['P', 'Q', 'S', 'R', 'W'].includes(letraInicial);
    const soloNumero = ['A', 'B', 'E', 'H'].includes(letraInicial);

    if (soloLetra) {
      if (caracterControl !== letraControlCalculada) {
        return {
          valido: false,
          motivo: `CIF no válido: el carácter de control debe ser ${letraControlCalculada}`,
        };
      }
    } else if (soloNumero) {
      if (caracterControl !== String(digitoControlCalculado)) {
        return {
          valido: false,
          motivo: `CIF no válido: el dígito de control debe ser ${digitoControlCalculado}`,
        };
      }
    } else {
      // Puede ser número o letra
      if (
        caracterControl !== String(digitoControlCalculado) &&
        caracterControl !== letraControlCalculada
      ) {
        return { valido: false, motivo: 'CIF no válido: dígito o letra de control incorrectos' };
      }
    }

    return { valido: true, motivo: '' };
  }

  return {
    valido: false,
    motivo: 'Formato de identificador no reconocido. Debe ser un DNI, NIE o CIF español válido',
  };
}

/**
 * Diccionario centralizado de validadores asociados a atributos data-validar.
 * Cumple con el requisito 19 para desacoplar las reglas del DOM.
 */
export const validadores = {
  usuario: validarNombreUsuario,
  correo: validarCorreo,
  clave: validarClave,
  nombreJornada: validarNombreJornada,
  fechaEvento: validarFechaEvento,
  generoMusical: validarGeneroMusical,
  aforo: validarAforoMaximo,
  tipoAcceso: validarTipoAcceso,
  suplementoVip: validarSuplementoVip,
  patrocinador: validarPatrocinador,
  licencia: validarCodigoLicencia,
  telefono: validarTelefonoContacto,
  cif: validarCifPromotora,
};
