import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaListado } from '../../js/paginas/listado.js';
import { iniciarSesion } from '../../js/datos/sesion.js';
import { guardarJornada, obtenerJornadas } from '../../js/datos/jornadas.js';

describe('Pruebas de Integración: Listado y Catálogo (listado.html)', () => {
  let almacenSesion;
  let almacenJornadas;
  let navegar;
  const usuarioActivo = { nombre: 'promotor_fest', rol: 'usuario' };

  beforeEach(() => {
    almacenSesion = new AlmacenFalso();
    almacenJornadas = new AlmacenFalso();
    navegar = vi.fn();
    iniciarSesion(usuarioActivo, almacenSesion);
    cargarPagina('listado.html');
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('sin sesión activa redirige a index.html', () => {
    almacenSesion.clear();
    iniciarPaginaListado(document, { almacenSesion, almacenJornadas, navegar });
    expect(navegar).toHaveBeenCalledWith('index.html');
  });

  it('muestra mensaje vacío y oculta contenedor si el usuario no tiene jornadas', () => {
    iniciarPaginaListado(document, { almacenSesion, almacenJornadas, navegar });

    const mensajeVacio = document.querySelector('#mensaje-vacio');
    const contenedor = document.querySelector('#contenedor-jornadas');
    const contador = document.querySelector('#contador-resultados');

    expect(mensajeVacio.hidden).toBe(false);
    expect(contenedor.hidden).toBe(true);
    expect(contador.textContent).toContain('0 jornadas');
  });

  it('renderiza tarjetas de jornadas desde el template con textContent y enlaces de edición', () => {
    guardarJornada(
      usuarioActivo.nombre,
      {
        nombreJornada: 'Main Stage Rock 2026',
        generoMusical: 'rock',
        aforoMaximo: 20000,
        tipoAcceso: 'general',
        fechaEvento: '2026-11-25',
        codigoLicencia: 'FEST-2026-ROCK',
        telefonoContacto: '612345678',
        cifPromotora: 'B12345674',
        patrocinadores: ['Vans'],
      },
      almacenJornadas,
    );

    iniciarPaginaListado(document, { almacenSesion, almacenJornadas, navegar });

    const mensajeVacio = document.querySelector('#mensaje-vacio');
    const contenedor = document.querySelector('#contenedor-jornadas');
    const tarjetas = contenedor.querySelectorAll('.item-jornada');

    expect(mensajeVacio.hidden).toBe(true);
    expect(tarjetas).toHaveLength(1);

    const tarjeta = tarjetas[0];
    expect(tarjeta.querySelector('.jornada-nombre').textContent).toBe('Main Stage Rock 2026');
    expect(tarjeta.querySelector('.badge-genero').textContent).toBe('rock');
    expect(tarjeta.querySelector('.jornada-fecha').textContent).toBe('2026-11-25');
    expect(tarjeta.querySelector('.enlace-editar').getAttribute('href')).toContain(
      'ficha.html?id=',
    );
  });

  it('búsqueda con debounce usando temporizadores falsos (vi.useFakeTimers)', () => {
    vi.useFakeTimers();

    guardarJornada(
      usuarioActivo.nombre,
      { nombreJornada: 'Metal Apocalypse', generoMusical: 'metal', aforoMaximo: 5000 },
      almacenJornadas,
    );
    guardarJornada(
      usuarioActivo.nombre,
      { nombreJornada: 'Electro Night', generoMusical: 'electronic', aforoMaximo: 8000 },
      almacenJornadas,
    );

    iniciarPaginaListado(document, {
      almacenSesion,
      almacenJornadas,
      navegar,
      debounceMs: 300,
    });

    const contenedor = document.querySelector('#contenedor-jornadas');
    const inputBuscador = document.querySelector('#input-buscador');

    expect(contenedor.querySelectorAll('.item-jornada')).toHaveLength(2);

    // Escribir en el buscador término insensible a tildes/mayúsculas
    escribir(inputBuscador, 'Élèctro');

    // Antes de los 300ms, no debe haberse ejecutado el filtrado todavía
    vi.advanceTimersByTime(200);
    expect(contenedor.querySelectorAll('.item-jornada')).toHaveLength(2);

    // Al cumplirse los 300ms, el debounce ejecuta la búsqueda
    vi.advanceTimersByTime(100);
    const filtrados = contenedor.querySelectorAll('.item-jornada');
    expect(filtrados).toHaveLength(1);
    expect(filtrados[0].querySelector('.jornada-nombre').textContent).toBe('Electro Night');
  });

  it('paginación: cambio de página con controles accesibles y delegación', () => {
    // Guardar 5 jornadas (con 3 por página, resultan 2 páginas)
    for (let i = 1; i <= 5; i += 1) {
      guardarJornada(
        usuarioActivo.nombre,
        {
          nombreJornada: `Jornada ${i}`,
          generoMusical: 'rock',
          aforoMaximo: 1000 * i,
        },
        almacenJornadas,
      );
    }

    iniciarPaginaListado(document, { almacenSesion, almacenJornadas, navegar });

    const contenedor = document.querySelector('#contenedor-jornadas');
    const navPaginacion = document.querySelector('#nav-paginacion');

    // Página 1: debe mostrar exactamente 3 elementos
    expect(contenedor.querySelectorAll('.item-jornada')).toHaveLength(3);
    expect(contenedor.querySelector('.jornada-nombre').textContent).toBe('Jornada 1');

    // Comprobar botón página 2
    const btnPagina2 = navPaginacion.querySelector('button[data-pagina="2"]');
    expect(btnPagina2).not.toBeNull();

    // Cambiar a página 2 mediante click
    btnPagina2.click();

    // Página 2: debe mostrar los 2 elementos restantes
    expect(contenedor.querySelectorAll('.item-jornada')).toHaveLength(2);
    expect(contenedor.querySelector('.jornada-nombre').textContent).toBe('Jornada 4');
  });

  it('borrado con confirmación mediante <dialog>', () => {
    guardarJornada(
      usuarioActivo.nombre,
      { nombreJornada: 'Jornada a Borrar', aforoMaximo: 1000 },
      almacenJornadas,
    );

    iniciarPaginaListado(document, { almacenSesion, almacenJornadas, navegar });

    const contenedor = document.querySelector('#contenedor-jornadas');
    const dialog = document.querySelector('#dialog-confirmar-borrado');
    const btnBorrar = contenedor.querySelector('.btn-borrar');
    const btnCancelar = document.querySelector('#btn-cancelar-borrado');
    const btnAceptar = document.querySelector('#btn-aceptar-borrado');

    // Pulsar botón borrar en la tarjeta
    btnBorrar.click();
    expect(dialog.open).toBe(true);
    expect(document.querySelector('#nombre-jornada-borrar').textContent).toBe('Jornada a Borrar');

    // Pulsar cancelar
    btnCancelar.click();
    expect(dialog.open).toBe(false);
    expect(obtenerJornadas(usuarioActivo.nombre, almacenJornadas)).toHaveLength(1);

    // Pulsar borrar de nuevo y confirmar
    btnBorrar.click();
    btnAceptar.click();

    expect(dialog.open).toBe(false);
    expect(obtenerJornadas(usuarioActivo.nombre, almacenJornadas)).toHaveLength(0);
    expect(contenedor.hidden).toBe(true);
    expect(document.querySelector('#mensaje-vacio').hidden).toBe(false);
  });
});
