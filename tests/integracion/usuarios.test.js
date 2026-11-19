import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaUsuarios } from '../../js/paginas/usuarios.js';
import { iniciarSesion } from '../../js/datos/sesion.js';
import { registrarUsuario, obtenerUsuarios } from '../../js/datos/usuarios.js';

const resumirFalso = async (c) => `hash_${c}`;

describe('Pruebas de Integración: Zona de Administración (usuarios.html)', () => {
  let almacenSesion;
  let almacenUsuarios;
  let navegar;

  beforeEach(() => {
    almacenSesion = new AlmacenFalso();
    almacenUsuarios = new AlmacenFalso();
    navegar = vi.fn();
    cargarPagina('usuarios.html');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('sin sesión activa redirige a index.html', () => {
    iniciarPaginaUsuarios(document, { almacenSesion, almacenUsuarios, navegar });
    expect(navegar).toHaveBeenCalledWith('index.html');
  });

  it('protección por rol: un usuario que no es administrador no puede quedarse en usuarios.html y es redirigido a listado.html con aviso', () => {
    iniciarSesion({ nombre: 'promotor_normal', rol: 'usuario' }, almacenSesion);

    iniciarPaginaUsuarios(document, { almacenSesion, almacenUsuarios, navegar });

    expect(navegar).toHaveBeenCalledWith('listado.html');
    const aviso = almacenSesion.getItem('aviso_pendiente');
    expect(aviso).toContain('danger');
    expect(aviso).toContain('Acceso denegado');
  });

  it('un administrador puede acceder y ver el listado de usuarios con nombre, correo y rol', async () => {
    const admin = await registrarUsuario(
      { nombre: 'superadmin', correo: 'admin@fest.com', clave: 'Valida123' },
      almacenUsuarios,
      resumirFalso,
    );
    await registrarUsuario(
      { nombre: 'promotor_dos', correo: 'dos@fest.com', clave: 'Valida123' },
      almacenUsuarios,
      resumirFalso,
    );

    iniciarSesion({ nombre: admin.nombre, rol: admin.rol }, almacenSesion);
    iniciarPaginaUsuarios(document, { almacenSesion, almacenUsuarios, navegar });

    expect(navegar).not.toHaveBeenCalled();

    const contenedor = document.querySelector('#contenedor-usuarios');
    const filas = contenedor.querySelectorAll('.fila-usuario');
    expect(filas).toHaveLength(2);

    expect(filas[0].querySelector('.usuario-nombre').textContent).toBe('superadmin');
    expect(filas[0].querySelector('.usuario-badge-rol').textContent).toBe('ADMINISTRADOR');

    expect(filas[1].querySelector('.usuario-nombre').textContent).toBe('promotor_dos');
    expect(filas[1].querySelector('.usuario-badge-rol').textContent).toBe('USUARIO');
  });

  it('el administrador no puede quitarse el rol a sí mismo (botón deshabilitado con explicación)', async () => {
    const admin = await registrarUsuario(
      { nombre: 'admin_principal', correo: 'admin@fest.com', clave: 'Valida123' },
      almacenUsuarios,
      resumirFalso,
    );

    iniciarSesion({ nombre: admin.nombre, rol: admin.rol }, almacenSesion);
    iniciarPaginaUsuarios(document, { almacenSesion, almacenUsuarios, navegar });

    const btnPropio = document.querySelector('.btn-cambiar-rol');
    expect(btnPropio.disabled).toBe(true);
    expect(btnPropio.title).toContain('No puedes quitarte el rol');
    expect(btnPropio.textContent).toContain('Tu cuenta (Admin)');
  });

  it('permite cambiar el rol de otro usuario de usuario a administrador y viceversa', async () => {
    const admin = await registrarUsuario(
      { nombre: 'admin_uno', correo: 'admin1@fest.com', clave: 'Valida123' },
      almacenUsuarios,
      resumirFalso,
    );
    await registrarUsuario(
      { nombre: 'promotor_junior', correo: 'junior@fest.com', clave: 'Valida123' },
      almacenUsuarios,
      resumirFalso,
    );

    iniciarSesion({ nombre: admin.nombre, rol: admin.rol }, almacenSesion);
    iniciarPaginaUsuarios(document, { almacenSesion, almacenUsuarios, navegar });

    const contenedor = document.querySelector('#contenedor-usuarios');
    const filas = contenedor.querySelectorAll('.fila-usuario');
    const btnUser = filas[1].querySelector('.btn-cambiar-rol');

    expect(btnUser.textContent).toBe('Hacer Administrador');

    // Pulsar botón para hacer administrador
    btnUser.click();

    // Comprobar que en el almacenamiento ahora es administrador
    const usuariosActualizados = obtenerUsuarios(almacenUsuarios);
    const userPromovido = usuariosActualizados.find((u) => u.nombre === 'promotor_junior');
    expect(userPromovido.rol).toBe('administrador');

    // Comprobar que en el DOM se actualiza el badge y el botón cambia a 'Quitar Administrador'
    const filasActualizadas = document.querySelectorAll('.fila-usuario');
    const btnNuevo = filasActualizadas[1].querySelector('.btn-cambiar-rol');
    expect(btnNuevo.textContent).toBe('Quitar Administrador');
  });

  it('buscador con debounce en la tabla de usuarios', async () => {
    vi.useFakeTimers();

    const admin = await registrarUsuario(
      { nombre: 'admin_rock', correo: 'rock@fest.com', clave: 'Valida123' },
      almacenUsuarios,
      resumirFalso,
    );
    await registrarUsuario(
      { nombre: 'promotor_indie', correo: 'indie@fest.com', clave: 'Valida123' },
      almacenUsuarios,
      resumirFalso,
    );

    iniciarSesion({ nombre: admin.nombre, rol: admin.rol }, almacenSesion);
    iniciarPaginaUsuarios(document, {
      almacenSesion,
      almacenUsuarios,
      navegar,
      debounceMs: 300,
    });

    const input = document.querySelector('#input-buscador-usuarios');
    const contenedor = document.querySelector('#contenedor-usuarios');

    expect(contenedor.querySelectorAll('.fila-usuario')).toHaveLength(2);

    escribir(input, 'indie');
    vi.advanceTimersByTime(200);
    expect(contenedor.querySelectorAll('.fila-usuario')).toHaveLength(2);

    vi.advanceTimersByTime(100);
    const filasFiltradas = contenedor.querySelectorAll('.fila-usuario');
    expect(filasFiltradas).toHaveLength(1);
    expect(filasFiltradas[0].querySelector('.usuario-nombre').textContent).toBe('promotor_indie');
  });
});
