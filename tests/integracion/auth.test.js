import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaLogin } from '../../js/paginas/login.js';
import { iniciarPaginaRegistro } from '../../js/paginas/registro.js';
import { iniciarPaginaListado } from '../../js/paginas/listado.js';
import { iniciarPaginaUsuarios } from '../../js/paginas/usuarios.js';
import { iniciarSesion, obtenerSesion } from '../../js/datos/sesion.js';
import { registrarUsuario } from '../../js/datos/usuarios.js';

const resumirFalso = async (clave) => `hash_${clave}`;

describe('Pruebas de Integración: Autenticación, Registro y Rutas Protegidas', () => {
  let almacenUsuarios;
  let almacenSesion;
  let navegar;

  beforeEach(() => {
    almacenUsuarios = new AlmacenFalso();
    almacenSesion = new AlmacenFalso();
    navegar = vi.fn();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Página de Inicio de Sesión (index.html)', () => {
    it('si ya existe una sesión activa, redirige de inmediato a listado.html', () => {
      cargarPagina('index.html');
      iniciarSesion({ nombre: 'AdminFest', rol: 'administrador' }, almacenSesion);

      iniciarPaginaLogin(document, {
        almacenUsuarios,
        almacenSesion,
        resumir: resumirFalso,
        navegar,
      });

      expect(navegar).toHaveBeenCalledWith('listado.html');
    });

    it('con contraseña incorrecta, vacía el campo de clave, le da el foco y muestra aviso', async () => {
      await registrarUsuario(
        { nombre: 'Promotor1', correo: 'p1@fest.es', clave: 'Valida123' },
        almacenUsuarios,
        resumirFalso
      );

      cargarPagina('index.html');
      iniciarPaginaLogin(document, {
        almacenUsuarios,
        almacenSesion,
        resumir: resumirFalso,
        navegar,
      });

      const campoNombre = document.querySelector('#login-nombre');
      const campoClave = document.querySelector('#login-clave');
      const formulario = document.querySelector('#form-login');

      escribir(campoNombre, 'Promotor1');
      escribir(campoClave, 'Erronea999');

      formulario.requestSubmit();
      await vi.waitFor(() => {
        expect(campoClave.value).toBe('');
      });

      expect(document.activeElement).toBe(campoClave);
      expect(navegar).not.toHaveBeenCalled();
      expect(document.querySelector('#zona-avisos').textContent).toContain(
        'Usuario o contraseña incorrectos'
      );
    });

    it('con credenciales válidas, inicia sesión y navega a listado.html', async () => {
      await registrarUsuario(
        { nombre: 'Kelsier', correo: 'kelsier@fest.es', clave: 'ClaveSegura1' },
        almacenUsuarios,
        resumirFalso
      );

      cargarPagina('index.html');
      iniciarPaginaLogin(document, {
        almacenUsuarios,
        almacenSesion,
        resumir: resumirFalso,
        navegar,
      });

      const campoNombre = document.querySelector('#login-nombre');
      const campoClave = document.querySelector('#login-clave');
      const formulario = document.querySelector('#form-login');

      escribir(campoNombre, 'Kelsier');
      escribir(campoClave, 'ClaveSegura1');

      formulario.requestSubmit();

      await vi.waitFor(() => {
        expect(navegar).toHaveBeenCalledWith('listado.html');
      });

      const sesionGuardada = obtenerSesion(almacenSesion);
      expect(sesionGuardada).toEqual({
        nombre: 'Kelsier',
        rol: 'administrador',
      });
    });
  });

  describe('Página de Registro (registro.html)', () => {
    it('muestra errores al salir de un campo vacío o no válido (evento blur en captura)', () => {
      cargarPagina('registro.html');
      iniciarPaginaRegistro(document, {
        almacenUsuarios,
        almacenSesion,
        resumir: resumirFalso,
        navegar,
      });

      const campoNombre = document.querySelector('#registro-nombre');
      const errorNombre = document.querySelector('#error-registro-nombre');

      salir(campoNombre);
      expect(errorNombre.textContent).toBe('El nombre de usuario es obligatorio');
      expect(campoNombre.classList.contains('is-invalid')).toBe(true);
    });

    it('actualiza en tiempo real los requisitos visuales de la contraseña al escribir', () => {
      cargarPagina('registro.html');
      iniciarPaginaRegistro(document, {
        almacenUsuarios,
        almacenSesion,
        resumir: resumirFalso,
        navegar,
      });

      const campoClave = document.querySelector('#registro-clave');
      const reqLongitud = document.querySelector('#req-longitud');
      const reqMinuscula = document.querySelector('#req-minuscula');
      const reqMayuscula = document.querySelector('#req-mayuscula');
      const reqCifra = document.querySelector('#req-cifra');

      escribir(campoClave, 'aB1');
      expect(reqLongitud.classList.contains('cumplido')).toBe(false);
      expect(reqMinuscula.classList.contains('cumplido')).toBe(true);
      expect(reqMayuscula.classList.contains('cumplido')).toBe(true);
      expect(reqCifra.classList.contains('cumplido')).toBe(true);

      escribir(campoClave, 'aB123456');
      expect(reqLongitud.classList.contains('cumplido')).toBe(true);
    });

    it('al completar el registro, entra con sesión iniciada y navega a listado.html', async () => {
      cargarPagina('registro.html');
      iniciarPaginaRegistro(document, {
        almacenUsuarios,
        almacenSesion,
        resumir: resumirFalso,
        navegar,
      });

      const campoNombre = document.querySelector('#registro-nombre');
      const campoCorreo = document.querySelector('#registro-correo');
      const campoClave = document.querySelector('#registro-clave');
      const campoRepetir = document.querySelector('#registro-repetir-clave');
      const campoTerminos = document.querySelector('#registro-terminos');
      const formulario = document.querySelector('#form-registro');

      escribir(campoNombre, 'PrimerPromotor');
      escribir(campoCorreo, 'promotor@beatfest.es');
      escribir(campoClave, 'ClaveFuerte1');
      escribir(campoRepetir, 'ClaveFuerte1');
      campoTerminos.checked = true;

      formulario.requestSubmit();

      await vi.waitFor(() => {
        expect(navegar).toHaveBeenCalledWith('listado.html');
      });

      const sesion = obtenerSesion(almacenSesion);
      expect(sesion.nombre).toBe('PrimerPromotor');
      expect(sesion.rol).toBe('administrador'); // Primer usuario registrado
    });
  });

  describe('Protección de Rutas Privadas y Roles', () => {
    it('listado.html redirige a index.html si no hay sesión', () => {
      cargarPagina('listado.html');
      iniciarPaginaListado(document, { almacenSesion, navegar });
      expect(navegar).toHaveBeenCalledWith('index.html');
    });

    it('usuarios.html redirige a index.html si no hay sesión', () => {
      cargarPagina('usuarios.html');
      iniciarPaginaUsuarios(document, { almacenSesion, navegar });
      expect(navegar).toHaveBeenCalledWith('index.html');
    });

    it('usuarios.html redirige a listado.html con aviso de error si el usuario NO es administrador', () => {
      iniciarSesion({ nombre: 'PromotorEstandar', rol: 'usuario' }, almacenSesion);

      cargarPagina('usuarios.html');
      iniciarPaginaUsuarios(document, { almacenSesion, navegar });

      expect(navegar).toHaveBeenCalledWith('listado.html');
    });

    it('usuarios.html permite el acceso si el usuario es administrador', () => {
      iniciarSesion({ nombre: 'AdminJefe', rol: 'administrador' }, almacenSesion);

      cargarPagina('usuarios.html');
      iniciarPaginaUsuarios(document, { almacenSesion, navegar });

      expect(navegar).not.toHaveBeenCalled();
      expect(document.querySelector('#cabecera-usuario').textContent).toBe('AdminJefe');
    });
  });
});
