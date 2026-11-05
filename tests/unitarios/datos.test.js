import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { leer, guardar, eliminar } from '../../js/datos/almacen.js';
import {
  obtenerUsuarios,
  registrarUsuario,
  verificarCredenciales,
  buscarUsuarioPorNombre,
  buscarUsuarioPorCorreo,
  CLAVE_USUARIOS,
} from '../../js/datos/usuarios.js';
import {
  obtenerSesion,
  iniciarSesion,
  cerrarSesion,
  haySesion,
  esAdministrador,
  CLAVE_SESION,
} from '../../js/datos/sesion.js';

// Doble de prueba síncrono para calcular hash en tests
const resumirFalso = async (clave) => `hash_${clave}`;

describe('Módulo de Almacén genérico (resistencia a fallos)', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('guarda y lee un valor correctamente', () => {
    guardar(almacen, 'clave_prueba', { valor: 42 });
    expect(leer(almacen, 'clave_prueba', null)).toEqual({ valor: 42 });
  });

  it('devuelve el valor por defecto si la clave no existe', () => {
    expect(leer(almacen, 'inexistente', 'defecto')).toBe('defecto');
  });

  it('no falla y devuelve el valor por defecto si lo guardado está estropeado (JSON inválido)', () => {
    almacen.setItem('corrupta', '{"incompleto: 123');
    expect(leer(almacen, 'corrupta', 'defecto')).toBe('defecto');
  });

  it('elimina un elemento guardado', () => {
    guardar(almacen, 'eliminar_clave', 'dato');
    eliminar(almacen, 'eliminar_clave');
    expect(leer(almacen, 'eliminar_clave', null)).toBeNull();
  });
});

describe('Módulo de Usuarios y Roles', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('obtenerUsuarios devuelve un array vacío si no hay datos', () => {
    expect(obtenerUsuarios(almacen)).toEqual([]);
  });

  it('obtenerUsuarios devuelve un array vacío si los datos están estropeados', () => {
    almacen.setItem(CLAVE_USUARIOS, 'esto no es un json ni un array');
    expect(obtenerUsuarios(almacen)).toEqual([]);
  });

  it('el primer usuario registrado se convierte en administrador', async () => {
    const usuario1 = await registrarUsuario(
      { nombre: 'Kelsier', correo: 'kelsier@scadrial.live', clave: 'Kelsier123' },
      almacen,
      resumirFalso,
    );

    expect(usuario1.rol).toBe('administrador');
    expect(usuario1.nombre).toBe('Kelsier');

    const lista = obtenerUsuarios(almacen);
    expect(lista).toHaveLength(1);
    expect(lista[0].rol).toBe('administrador');
  });

  it('los usuarios registrados después del primero son usuarios normales', async () => {
    await registrarUsuario(
      { nombre: 'Kelsier', correo: 'kelsier@scadrial.live', clave: 'Kelsier123' },
      almacen,
      resumirFalso,
    );
    const usuario2 = await registrarUsuario(
      { nombre: 'Vin', correo: 'vin@scadrial.live', clave: 'VinBrumas123' },
      almacen,
      resumirFalso,
    );

    expect(usuario2.rol).toBe('usuario');
    const lista = obtenerUsuarios(almacen);
    expect(lista).toHaveLength(2);
    expect(lista[1].rol).toBe('usuario');
  });

  it('la contraseña nunca se guarda en claro, solo como resumen hash', async () => {
    await registrarUsuario(
      { nombre: 'Ham', correo: 'ham@scadrial.live', clave: 'Peltre999' },
      almacen,
      resumirFalso,
    );

    const lista = obtenerUsuarios(almacen);
    expect(lista[0].clave).toBeUndefined();
    expect(lista[0].claveHash).toBe('hash_Peltre999');
  });

  it('falla con un error descriptivo si el nombre de usuario ya está ocupado', async () => {
    await registrarUsuario(
      { nombre: 'Breeze', correo: 'breeze@scadrial.live', clave: 'Latón123' },
      almacen,
      resumirFalso,
    );

    await expect(
      registrarUsuario(
        { nombre: 'breeze', correo: 'otro@scadrial.live', clave: 'Otra1234' },
        almacen,
        resumirFalso,
      ),
    ).rejects.toThrow('El nombre de usuario ya está en uso');
  });

  it('falla con un error descriptivo si el correo ya está registrado', async () => {
    await registrarUsuario(
      { nombre: 'Spook', correo: 'spook@scadrial.live', clave: 'Estaño123' },
      almacen,
      resumirFalso,
    );

    await expect(
      registrarUsuario(
        { nombre: 'Lestibournes', correo: 'spook@scadrial.live', clave: 'Estaño123' },
        almacen,
        resumirFalso,
      ),
    ).rejects.toThrow('El correo electrónico ya está registrado');
  });

  it('verificarCredenciales devuelve los datos del usuario con la contraseña correcta', async () => {
    await registrarUsuario(
      { nombre: 'Sazed', correo: 'sazed@scadrial.live', clave: 'Feruquimia1' },
      almacen,
      resumirFalso,
    );

    const sesion = await verificarCredenciales('Sazed', 'Feruquimia1', almacen, resumirFalso);
    expect(sesion).not.toBeNull();
    expect(sesion.nombre).toBe('Sazed');
    expect(sesion.rol).toBe('administrador');
  });

  it('verificarCredenciales devuelve null con contraseña incorrecta o usuario inexistente', async () => {
    await registrarUsuario(
      { nombre: 'Marsh', correo: 'marsh@scadrial.live', clave: 'Inquisidor1' },
      almacen,
      resumirFalso,
    );

    const falloClave = await verificarCredenciales('Marsh', 'ClaveErronea', almacen, resumirFalso);
    expect(falloClave).toBeNull();

    const falloUsuario = await verificarCredenciales(
      'Inexistente',
      'ClaveCualquiera',
      almacen,
      resumirFalso,
    );
    expect(falloUsuario).toBeNull();
  });

  it('buscarUsuarioPorNombre y buscarUsuarioPorCorreo devuelven null si no existen', () => {
    expect(buscarUsuarioPorNombre('nadie', almacen)).toBeNull();
    expect(buscarUsuarioPorCorreo('nadie@correo.es', almacen)).toBeNull();
  });
});

describe('Módulo de Sesión', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('obtenerSesion devuelve null si no hay sesión activa', () => {
    expect(obtenerSesion(almacen)).toBeNull();
    expect(haySesion(almacen)).toBe(false);
  });

  it('inicia y obtiene sesión correctamente', () => {
    iniciarSesion({ nombre: 'Kelsier', rol: 'administrador' }, almacen);
    expect(haySesion(almacen)).toBe(true);
    expect(obtenerSesion(almacen)).toEqual({
      nombre: 'Kelsier',
      rol: 'administrador',
    });
    expect(esAdministrador(almacen)).toBe(true);
  });

  it('esAdministrador devuelve false si el usuario tiene rol usuario', () => {
    iniciarSesion({ nombre: 'Vin', rol: 'usuario' }, almacen);
    expect(esAdministrador(almacen)).toBe(false);
  });

  it('cierra la sesión eliminando los datos', () => {
    iniciarSesion({ nombre: 'Kelsier', rol: 'administrador' }, almacen);
    cerrarSesion(almacen);
    expect(haySesion(almacen)).toBe(false);
    expect(obtenerSesion(almacen)).toBeNull();
  });

  it('no falla y devuelve null si los datos de sesión en el almacenamiento están estropeados', () => {
    almacen.setItem(CLAVE_SESION, '{"corrupto: no json');
    expect(obtenerSesion(almacen)).toBeNull();
    expect(haySesion(almacen)).toBe(false);
  });
});
