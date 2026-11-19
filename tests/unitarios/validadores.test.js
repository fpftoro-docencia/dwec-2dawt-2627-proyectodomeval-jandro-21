import { describe, it, expect } from 'vitest';
import {
  validarNombreUsuario,
  validarCorreo,
  comprobarRequisitosClave,
  validarClave,
  validarRepeticionClave,
  validarTerminos,
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
