import { describe, it, expect } from 'vitest';
import {
  validarNombreUsuario,
  validarCorreo,
  comprobarRequisitosClave,
  validarClave,
  validarRepeticionClave,
  validarTerminos,
  validarNombreJornada,
  validarFechaEvento,
  validarGeneroMusical,
  validarAforoMaximo,
  validarTipoAcceso,
  validarSuplementoVip,
  validarPatrocinador,
  validarCodigoLicencia,
  validarTelefonoContacto,
  validarCifPromotora,
  validadores,
} from '../../js/logica/validadores.js';

describe('Validador de Nombre de Usuario (con tablas it.each)', () => {
  describe('Casos válidos (incluyendo valores límite)', () => {
    it.each([
      ['abc', 'límite inferior exacto de 3 caracteres'],
      ['promotor_fest', 'caso normal con guion bajo'],
      ['sound-metal', 'caso con guion medio'],
      ['rock2026', 'caso alfanumérico'],
      ['12345678901234567890', 'límite superior exacto de 20 caracteres'],
    ])('el nombre «%s» es válido (%s)', (nombre) => {
      const resultado = validarNombreUsuario(nombre);
      expect(resultado.valido).toBe(true);
      expect(resultado.motivo).toBe('');
    });
  });

  describe('Casos no válidos por cada regla', () => {
    it.each([
      ['', 'El nombre de usuario es obligatorio', 'campo vacío'],
      ['   ', 'El nombre de usuario es obligatorio', 'solo espacios en blanco'],
      ['ab', 'El nombre debe tener al menos 3 caracteres', 'longitud menor de 3 caracteres'],
      [
        'usuario_con_mas_de_veinte_caracteres',
        'El nombre no puede tener más de 20 caracteres',
        'longitud mayor de 20 caracteres',
      ],
      [
        'usuario con espacios',
        'Solo se permiten letras sin tilde, números, guiones y guiones bajos',
        'contiene espacios intermedios',
      ],
      [
        'música',
        'Solo se permiten letras sin tilde, números, guiones y guiones bajos',
        'contiene letra con tilde',
      ],
      [
        'promotor@fest',
        'Solo se permiten letras sin tilde, números, guiones y guiones bajos',
        'contiene símbolos especiales no permitidos (@)',
      ],
    ])('el nombre «%s» falla con motivo «%s» (%s)', (nombre, motivoEsperado) => {
      const resultado = validarNombreUsuario(nombre);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });
});

describe('Validador de Correo Electrónico', () => {
  describe('Casos válidos', () => {
    it.each([
      ['promotor@beatfest.live'],
      ['contacto.fest@dominio.com'],
      ['musica+alternativa@sub.festival.es'],
    ])('el correo «%s» es válido', (correo) => {
      const resultado = validarCorreo(correo);
      expect(resultado.valido).toBe(true);
      expect(resultado.motivo).toBe('');
    });
  });

  describe('Casos no válidos', () => {
    it.each([
      ['', 'El correo electrónico es obligatorio', 'campo vacío'],
      [
        'sin_arroba_dominio.com',
        'Introduce un formato de correo electrónico válido',
        'falta la arroba',
      ],
      ['usuario@', 'Introduce un formato de correo electrónico válido', 'falta el dominio'],
      [
        'usuario@dominio',
        'Introduce un formato de correo electrónico válido',
        'falta la extensión TLD',
      ],
      [
        '@dominio.com',
        'Introduce un formato de correo electrónico válido',
        'falta el usuario antes de la arroba',
      ],
    ])('el correo «%s» falla con motivo «%s» (%s)', (correo, motivoEsperado) => {
      const resultado = validarCorreo(correo);
      expect(resultado.valido).toBe(false);
      expect(resultado.motivo).toBe(motivoEsperado);
    });
  });
});

describe('Comprobación de Requisitos de Contraseña en tiempo real', () => {
  it.each([
    [
      'Abcdef12',
      { longitud: true, minuscula: true, mayuscula: true, cifra: true, valida: true },
      'cumple todos los requisitos',
    ],
    [
      'Ab1',
      { longitud: false, minuscula: true, mayuscula: true, cifra: true, valida: false },
      'menos de 8 caracteres',
    ],
    [
      'ABCDEFGH12',
      { longitud: true, minuscula: false, mayuscula: true, cifra: true, valida: false },
      'sin minúsculas',
    ],
    [
      'abcdefgh12',
      { longitud: true, minuscula: true, mayuscula: false, cifra: true, valida: false },
      'sin mayúsculas',
    ],
    [
      'Abcdefghijk',
      { longitud: true, minuscula: true, mayuscula: true, cifra: false, valida: false },
      'sin números',
    ],
    [
      'ÁbčdëfG1',
      { longitud: true, minuscula: true, mayuscula: true, cifra: true, valida: true },
      'reconoce minúsculas y mayúsculas con propiedades Unicode (\\p{Ll} y \\p{Lu})',
    ],
  ])('la clave «%s» da %o (%s)', (clave, esperado) => {
    expect(comprobarRequisitosClave(clave)).toEqual(esperado);
  });

  it('validarClave reporta el motivo adecuado del primer requisito incumplido', () => {
    expect(validarClave('Ab1').motivo).toBe('La contraseña debe tener al menos 8 caracteres');
    expect(validarClave('ABCDEFGH1').motivo).toBe('Debe contener al menos una letra minúscula');
    expect(validarClave('abcdefgh1').motivo).toBe('Debe contener al menos una letra mayúscula');
    expect(validarClave('Abcdefghijk').motivo).toBe('Debe contener al menos un número');
    expect(validarClave('Abcdefgh1').valido).toBe(true);
  });
});

describe('Validación de Repetición de Contraseña y Términos', () => {
  it('validarRepeticionClave devuelve válido solo si ambas cadenas coinciden', () => {
    expect(validarRepeticionClave('ClaveSegura1', 'ClaveSegura1').valido).toBe(true);
    expect(validarRepeticionClave('ClaveSegura1', 'OtraDiferente2').valido).toBe(false);
    expect(validarRepeticionClave('ClaveSegura1', 'OtraDiferente2').motivo).toBe(
      'Las contraseñas no coinciden',
    );
    expect(validarRepeticionClave('ClaveSegura1', '').motivo).toBe('Debes repetir la contraseña');
  });

  it('validarTerminos exige que el valor sea exactamente true', () => {
    expect(validarTerminos(true).valido).toBe(true);
    expect(validarTerminos(false).valido).toBe(false);
    expect(validarTerminos(false).motivo).toBe('Debes aceptar los términos y condiciones');
  });
});

/* ==========================================================================
   TESTS UNITARIOS DE LA ENTIDAD: JORNADA DE FESTIVAL (SPRINT 2)
   ========================================================================== */

describe('Validador de Nombre de Jornada', () => {
  it.each([
    ['Rock', 'límite inferior exacto de 4 caracteres'],
    ['Noche Indie & Alternative 2026', 'caso medio con símbolos y espacios'],
    ['1234567890123456789012345678901234567890', 'límite superior exacto de 40 caracteres'],
  ])('el nombre de jornada «%s» es válido (%s)', (nombre) => {
    expect(validarNombreJornada(nombre).valido).toBe(true);
  });

  it.each([
    ['', 'El nombre de la jornada es obligatorio'],
    ['Dia', 'El nombre debe tener al menos 4 caracteres'],
    [
      'Nombre demasiado largo que supera exactamente los cuarenta caracteres permitidos',
      'El nombre no puede tener más de 40 caracteres',
    ],
    ['Rock <script>', 'El nombre contiene caracteres no permitidos'],
  ])('el nombre «%s» es inválido con motivo «%s»', (nombre, motivoEsperado) => {
    const res = validarNombreJornada(nombre);
    expect(res.valido).toBe(false);
    expect(res.motivo).toBe(motivoEsperado);
  });
});

describe('Validador de Fecha de Evento', () => {
  const hoyRef = new Date(2026, 10, 17); // 17 de noviembre de 2026

  it('acepta la fecha de hoy o fechas futuras válidas', () => {
    expect(validarFechaEvento('2026-11-17', hoyRef).valido).toBe(true);
    expect(validarFechaEvento('2026-11-18', hoyRef).valido).toBe(true);
    expect(validarFechaEvento('2027-07-20', hoyRef).valido).toBe(true);
  });

  it.each([
    ['2026-11-16', 'La fecha no puede ser anterior a hoy'],
    ['formato-invalido', 'Introduce una fecha en formato AAAA-MM-DD'],
    ['2026-02-30', 'La fecha introducida no existe en el calendario'],
  ])('la fecha «%s» es inválida con motivo «%s»', (fecha, motivoEsperado) => {
    const res = validarFechaEvento(fecha, hoyRef);
    expect(res.valido).toBe(false);
    expect(res.motivo).toBe(motivoEsperado);
  });
});

describe('Validador de Género Musical y Tipo de Acceso', () => {
  it('valida géneros musicales permitidos', () => {
    expect(validarGeneroMusical('rock').valido).toBe(true);
    expect(validarGeneroMusical('electronic').valido).toBe(true);
    expect(validarGeneroMusical('jazz').valido).toBe(false);
    expect(validarGeneroMusical('').valido).toBe(false);
  });

  it('valida tipo de acceso permitido', () => {
    expect(validarTipoAcceso('general').valido).toBe(true);
    expect(validarTipoAcceso('vip').valido).toBe(true);
    expect(validarTipoAcceso('barra_libre').valido).toBe(true);
    expect(validarTipoAcceso('otro').valido).toBe(false);
  });
});

describe('Validador de Aforo Máximo', () => {
  it.each([
    [50, 'límite inferior exacto'],
    [5000, 'caso habitual'],
    [100000, 'límite superior exacto'],
  ])('el aforo %s es válido (%s)', (aforo) => {
    expect(validarAforoMaximo(aforo).valido).toBe(true);
  });

  it.each([
    [49, 'El aforo mínimo permitido es de 50 asistentes'],
    [100001, 'El aforo máximo permitido es de 100.000 asistentes'],
    ['muchos', 'El aforo debe ser un número entero'],
    [50.5, 'El aforo debe ser un número entero'],
  ])('el aforo %s es inválido con motivo «%s»', (aforo, motivoEsperado) => {
    const res = validarAforoMaximo(aforo);
    expect(res.valido).toBe(false);
    expect(res.motivo).toBe(motivoEsperado);
  });
});

describe('Validador de Suplemento VIP y Patrocinador', () => {
  it('valida suplemento VIP mayor o igual a 0', () => {
    expect(validarSuplementoVip(0).valido).toBe(true);
    expect(validarSuplementoVip(25.5).valido).toBe(true);
    expect(validarSuplementoVip(-10).valido).toBe(false);
    expect(validarSuplementoVip('').valido).toBe(false);
  });

  it('valida patrocinadores entre 2 y 30 caracteres', () => {
    expect(validarPatrocinador('Vans').valido).toBe(true);
    expect(validarPatrocinador('V').valido).toBe(false);
    expect(validarPatrocinador('A'.repeat(31)).valido).toBe(false);
    expect(validarPatrocinador('').valido).toBe(false);
  });
});

describe('Validador de Código de Licencia (Regex FEST-AAAA-XXXX)', () => {
  it.each([['FEST-2026-ROCK'], ['FEST-2025-EDM1'], ['FEST-2030-9999']])(
    'el código de licencia «%s» es válido',
    (codigo) => {
      expect(validarCodigoLicencia(codigo).valido).toBe(true);
    },
  );

  it.each([
    ['', 'El código de licencia es obligatorio'],
    ['FEST-26-ROCK', 'Formato de licencia inválido. Debe ser FEST-AAAA-XXXX (ej: FEST-2026-ROCK)'],
    [
      'FEST-2026-rock',
      'Formato de licencia inválido. Debe ser FEST-AAAA-XXXX (ej: FEST-2026-ROCK)',
    ],
    ['LIC-2026-ROCK', 'Formato de licencia inválido. Debe ser FEST-AAAA-XXXX (ej: FEST-2026-ROCK)'],
  ])('el código «%s» es inválido con motivo «%s»', (codigo, motivoEsperado) => {
    const res = validarCodigoLicencia(codigo);
    expect(res.valido).toBe(false);
    expect(res.motivo).toBe(motivoEsperado);
  });
});

describe('Validador de Teléfono Móvil Español (Regex ^[67]\\d{8}$)', () => {
  it.each([
    ['612345678', 'móvil empezando por 6'],
    ['744123456', 'móvil empezando por 7'],
    ['600 000 000', 'permite espacios formateados'],
  ])('el teléfono «%s» es válido (%s)', (tel) => {
    expect(validarTelefonoContacto(tel).valido).toBe(true);
  });

  it.each([
    ['', 'El teléfono de contacto es obligatorio'],
    ['912345678', 'Debe ser un teléfono móvil español válido (9 dígitos comenzando por 6 o 7)'],
    ['61234567', 'Debe ser un teléfono móvil español válido (9 dígitos comenzando por 6 o 7)'],
    ['6123456789', 'Debe ser un teléfono móvil español válido (9 dígitos comenzando por 6 o 7)'],
    ['612abc789', 'Debe ser un teléfono móvil español válido (9 dígitos comenzando por 6 o 7)'],
  ])('el teléfono «%s» es inválido con motivo «%s»', (tel, motivoEsperado) => {
    const res = validarTelefonoContacto(tel);
    expect(res.valido).toBe(false);
    expect(res.motivo).toBe(motivoEsperado);
  });
});

describe('Validador de CIF / DNI / NIE con Algoritmo de Control', () => {
  it('valida DNI español con cálculo exacto de módulo 23', () => {
    // 12345678Z es válido: 12345678 % 23 = 14 -> Z
    expect(validarCifPromotora('12345678Z').valido).toBe(true);
    expect(validarCifPromotora('12345678A').valido).toBe(false);
    expect(validarCifPromotora('12345678A').motivo).toContain(
      'la letra correcta para ese número es Z',
    );
  });

  it('valida NIE español con reemplazo X/Y/Z y cálculo de letra', () => {
    // 1234567 % 23 = 19 -> letras[19] = 'L' -> X1234567L
    expect(validarCifPromotora('X1234567L').valido).toBe(true);
    expect(validarCifPromotora('X1234567A').valido).toBe(false);
  });

  it('valida CIF de empresa con dígito o letra de control oficial', () => {
    // CIF válido: B12345674 (B=Sociedad limitada -> solo dígito)
    // pares: pos 2, 4, 6 -> 2, 4, 6 -> suma = 12
    // impares: pos 1, 3, 5, 7 -> 1*2=2, 3*2=6, 5*2=10 (1+0=1), 7*2=14 (1+4=5) -> suma = 2+6+1+5 = 14
    // sumaTotal = 12 + 14 = 26.
    // digitoControl = (10 - (26 % 10)) % 10 = (10 - 6) = 4.
    // B12345674 tiene '4' al final -> Válido
    expect(validarCifPromotora('B12345674').valido).toBe(true);
    expect(validarCifPromotora('B12345679').valido).toBe(false);
    expect(validarCifPromotora('B12345679').motivo).toContain('el dígito de control debe ser 4');

    // CIF con letra de control (P, Q, S, R, W)
    // P1234567D: digitoControl = 4 -> letrasControl[4] = 'D'
    expect(validarCifPromotora('P1234567D').valido).toBe(true);
    expect(validarCifPromotora('P1234567A').valido).toBe(false);
  });

  it('rechaza identificadores fiscales con formato o tipo inválido', () => {
    expect(validarCifPromotora('').valido).toBe(false);
    expect(validarCifPromotora('1234').valido).toBe(false);
    expect(validarCifPromotora('ABCDEFG').valido).toBe(false);
  });
});

describe('Diccionario exportado de validadores para data-validar', () => {
  it('contiene todas las claves de validación requeridas', () => {
    expect(typeof validadores.usuario).toBe('function');
    expect(typeof validadores.correo).toBe('function');
    expect(typeof validadores.clave).toBe('function');
    expect(typeof validadores.nombreJornada).toBe('function');
    expect(typeof validadores.fechaEvento).toBe('function');
    expect(typeof validadores.generoMusical).toBe('function');
    expect(typeof validadores.aforo).toBe('function');
    expect(typeof validadores.tipoAcceso).toBe('function');
    expect(typeof validadores.suplementoVip).toBe('function');
    expect(typeof validadores.patrocinador).toBe('function');
    expect(typeof validadores.licencia).toBe('function');
    expect(typeof validadores.telefono).toBe('function');
    expect(typeof validadores.cif).toBe('function');
  });
});
