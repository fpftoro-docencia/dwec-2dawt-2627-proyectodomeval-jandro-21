import { beforeEach, describe, expect, it } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerClaveJornadas,
  obtenerJornadas,
  obtenerJornadaPorId,
  guardarJornada,
  eliminarJornada,
} from '../../js/datos/jornadas.js';
import { cambiarRolUsuario, registrarUsuario } from '../../js/datos/usuarios.js';

describe('Módulo de datos de Jornadas (jornadas.js)', () => {
  let almacen;
  const usuarioPrueba = 'promotor_rock';

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('genera la clave propia del usuario en minúsculas y normalizada', () => {
    expect(obtenerClaveJornadas('Promotor_Rock')).toBe('jornadas_promotor_rock');
    expect(obtenerClaveJornadas('')).toBe('jornadas_');
  });

  it('obtiene lista vacía si el usuario no tiene jornadas o no existe', () => {
    expect(obtenerJornadas(usuarioPrueba, almacen)).toEqual([]);
    expect(obtenerJornadas(null, almacen)).toEqual([]);
  });

  it('guarda una jornada nueva generando id único y marcas temporales', () => {
    const datos = {
      nombreJornada: 'Main Stage Opening',
      fechaEvento: '2026-11-20',
      generoMusical: 'rock',
      aforoMaximo: 25000,
      tipoAcceso: 'general',
      codigoLicencia: 'FEST-2026-ROCK',
      telefonoContacto: '612345678',
      cifPromotora: 'B12345674',
      patrocinadores: ['Vans', 'Monster'],
    };

    const guardada = guardarJornada(usuarioPrueba, datos, almacen);
    expect(guardada.id).toBeDefined();
    expect(guardada.id).toMatch(/^jornada_\d+_[a-z0-9]+$/);
    expect(guardada.creadoEn).toBeDefined();
    expect(guardada.actualizadoEn).toBeDefined();
    expect(guardada.nombreJornada).toBe('Main Stage Opening');

    const lista = obtenerJornadas(usuarioPrueba, almacen);
    expect(lista).toHaveLength(1);
    expect(lista[0].id).toBe(guardada.id);
  });

  it('actualiza una jornada existente si ya cuenta con id', () => {
    const inicial = guardarJornada(
      usuarioPrueba,
      { nombreJornada: 'Nombre Original', aforoMaximo: 500 },
      almacen,
    );

    const modificada = guardarJornada(
      usuarioPrueba,
      { id: inicial.id, nombreJornada: 'Nombre Editado', aforoMaximo: 800 },
      almacen,
    );

    expect(modificada.id).toBe(inicial.id);
    expect(modificada.nombreJornada).toBe('Nombre Editado');
    expect(modificada.aforoMaximo).toBe(800);

    const recuperada = obtenerJornadaPorId(usuarioPrueba, inicial.id, almacen);
    expect(recuperada.nombreJornada).toBe('Nombre Editado');
  });

  it('elimina una jornada existente correctamente', () => {
    const j1 = guardarJornada(usuarioPrueba, { nombreJornada: 'Jornada 1' }, almacen);
    const j2 = guardarJornada(usuarioPrueba, { nombreJornada: 'Jornada 2' }, almacen);

    expect(obtenerJornadas(usuarioPrueba, almacen)).toHaveLength(2);

    const borrado = eliminarJornada(usuarioPrueba, j1.id, almacen);
    expect(borrado).toBe(true);

    const restantes = obtenerJornadas(usuarioPrueba, almacen);
    expect(restantes).toHaveLength(1);
    expect(restantes[0].id).toBe(j2.id);

    // Intentar borrar un ID inexistente
    expect(eliminarJornada(usuarioPrueba, 'inexistente', almacen)).toBe(false);
  });

  it('aislamiento por usuario: cada usuario ve exclusivamente sus propias jornadas', () => {
    guardarJornada('usuario_uno', { nombreJornada: 'Jornada Uno' }, almacen);
    guardarJornada('usuario_dos', { nombreJornada: 'Jornada Dos' }, almacen);

    const jUno = obtenerJornadas('usuario_uno', almacen);
    const jDos = obtenerJornadas('usuario_dos', almacen);

    expect(jUno).toHaveLength(1);
    expect(jUno[0].nombreJornada).toBe('Jornada Uno');

    expect(jDos).toHaveLength(1);
    expect(jDos[0].nombreJornada).toBe('Jornada Dos');
  });

  it('resiliencia ante datos corruptos en el almacenamiento', () => {
    const clave = obtenerClaveJornadas(usuarioPrueba);
    // Inyectar JSON dañado/incompleto
    almacen.setItem(clave, '{ json_incompleto_o_estropeado: 123');

    const jornadas = obtenerJornadas(usuarioPrueba, almacen);
    expect(jornadas).toEqual([]);

    // Inyectar tipo no array (ej. string o número)
    almacen.setItem(clave, JSON.stringify({ esto: 'no es un array' }));
    expect(obtenerJornadas(usuarioPrueba, almacen)).toEqual([]);
  });

  it('cambiarRolUsuario modifica el rol de un usuario existente', async () => {
    const resumir = async (c) => `hash_${c}`;
    const u1 = await registrarUsuario(
      { nombre: 'admin', correo: 'admin@fest.com', clave: 'ClaveSegura1' },
      almacen,
      resumir,
    );
    const u2 = await registrarUsuario(
      { nombre: 'user2', correo: 'u2@fest.com', clave: 'ClaveSegura1' },
      almacen,
      resumir,
    );

    expect(u2.rol).toBe('usuario');
    const u2Promovido = cambiarRolUsuario(u2.id, 'administrador', almacen);
    expect(u2Promovido.rol).toBe('administrador');

    const u2Degradado = cambiarRolUsuario(u2.id, 'usuario', almacen);
    expect(u2Degradado.rol).toBe('usuario');

    expect(cambiarRolUsuario('id_inexistente', 'administrador', almacen)).toBeNull();
    expect(cambiarRolUsuario(u1.id, 'rol_invalido', almacen)).toBeNull();
  });
});
