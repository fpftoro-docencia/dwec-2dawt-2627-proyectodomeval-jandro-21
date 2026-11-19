import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { iniciarPaginaFicha } from '../../js/paginas/ficha.js';
import { iniciarSesion } from '../../js/datos/sesion.js';
import { obtenerJornadas, guardarJornada } from '../../js/datos/jornadas.js';

describe('Pruebas de Integración: Ficha de Jornada (ficha.html)', () => {
  let almacenSesion;
  let almacenJornadas;
  let navegar;
  const usuarioActivo = { nombre: 'promotor_fest', rol: 'usuario' };

  beforeEach(() => {
    almacenSesion = new AlmacenFalso();
    almacenJornadas = new AlmacenFalso();
    navegar = vi.fn();
    iniciarSesion(usuarioActivo, almacenSesion);
    cargarPagina('ficha.html');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('sin sesión activa redirige a index.html', () => {
    almacenSesion.clear();
    iniciarPaginaFicha(document, { almacenSesion, almacenJornadas, navegar });
    expect(navegar).toHaveBeenCalledWith('index.html');
  });

  it('con un id que no existe redirige a listado.html con aviso', () => {
    iniciarPaginaFicha(document, {
      almacenSesion,
      almacenJornadas,
      navegar,
      idJornada: 'jornada_inexistente_999',
    });

    expect(navegar).toHaveBeenCalledWith('listado.html');
    const avisoPendiente = almacenSesion.getItem('aviso_pendiente');
    expect(avisoPendiente).toContain('danger');
  });

  it('validación en fase de captura al salir (blur) y reactiva al escribir (input)', () => {
    iniciarPaginaFicha(document, { almacenSesion, almacenJornadas, navegar });

    const campoNombre = document.querySelector('#campo-nombre-jornada');
    const cajaError = document.querySelector('#error-nombre-jornada');

    // Inicialmente no tiene clase de error
    expect(campoNombre.classList.contains('is-invalid')).toBe(false);

    // Escribir un valor inválido (menos de 4 caracteres) y salir (blur)
    campoNombre.value = 'Dia';
    salir(campoNombre);

    // Debe marcarse con error tras el blur
    expect(campoNombre.classList.contains('is-invalid')).toBe(true);
    expect(cajaError.textContent).toBe('El nombre debe tener al menos 4 caracteres');

    // Ahora, al corregir escribiendo (input reactivo), el error desaparece de inmediato
    escribir(campoNombre, 'Opening Rock Fest 2026');
    expect(campoNombre.classList.contains('is-invalid')).toBe(false);
    expect(cajaError.textContent).toBe('');
  });

  it('campo condicional suplementoVip se activa y desactiva según tipo de acceso', () => {
    iniciarPaginaFicha(document, { almacenSesion, almacenJornadas, navegar });

    const contenedorVip = document.querySelector('#contenedor-suplemento-vip');
    const campoSuplementoVip = document.querySelector('#campo-suplemento-vip');
    const radioGeneral = document.querySelector('#acceso-general');
    const radioVip = document.querySelector('#acceso-vip');

    // En acceso General, está oculto y deshabilitado
    expect(contenedorVip.hidden).toBe(true);
    expect(campoSuplementoVip.disabled).toBe(true);

    // Al seleccionar VIP, se muestra y se habilita
    radioVip.checked = true;
    radioVip.dispatchEvent(new Event('change'));

    expect(contenedorVip.hidden).toBe(false);
    expect(campoSuplementoVip.disabled).toBe(false);

    // Al volver a General, se vuelve a ocultar y deshabilitar
    radioGeneral.checked = true;
    radioGeneral.dispatchEvent(new Event('change'));

    expect(contenedorVip.hidden).toBe(true);
    expect(campoSuplementoVip.disabled).toBe(true);
  });

  it('gestión del grupo dinámico de patrocinadores con template y límites (0 a 3)', () => {
    iniciarPaginaFicha(document, { almacenSesion, almacenJornadas, navegar });

    const btnAgregar = document.querySelector('#btn-agregar-patrocinador');
    const contenedor = document.querySelector('#contenedor-patrocinadores');

    expect(contenedor.children).toHaveLength(0);

    // Añadir 1
    btnAgregar.click();
    expect(contenedor.children).toHaveLength(1);
    const primerInput = contenedor.querySelector('.input-patrocinador');
    expect(primerInput.id).toBe('campo-patrocinador-1');

    // Añadir 2 y 3
    btnAgregar.click();
    btnAgregar.click();
    expect(contenedor.children).toHaveLength(3);
    // Límite alcanzado: botón añadir deshabilitado
    expect(btnAgregar.disabled).toBe(true);

    // Eliminar el segundo mediante delegación en el botón quitar
    const botonesQuitar = contenedor.querySelectorAll('.btn-quitar-patrocinador');
    botonesQuitar[1].click();

    expect(contenedor.children).toHaveLength(2);
    // Botón añadir habilitado de nuevo
    expect(btnAgregar.disabled).toBe(false);
  });

  it('envío de alta con datos exactos que se guardan en el almacenamiento', () => {
    iniciarPaginaFicha(document, { almacenSesion, almacenJornadas, navegar });

    const form = document.querySelector('#form-jornada');
    const campoNombre = document.querySelector('#campo-nombre-jornada');
    const campoFecha = document.querySelector('#campo-fecha-evento');
    const campoGenero = document.querySelector('#campo-genero-musical');
    const campoAforo = document.querySelector('#campo-aforo-maximo');
    const radioVip = document.querySelector('#acceso-vip');
    const campoSuplementoVip = document.querySelector('#campo-suplemento-vip');
    const campoLicencia = document.querySelector('#campo-codigo-licencia');
    const campoTelefono = document.querySelector('#campo-telefono-contacto');
    const campoCif = document.querySelector('#campo-cif-promotora');
    const btnAgregarPatrocinador = document.querySelector('#btn-agregar-patrocinador');

    // Rellenar datos
    campoNombre.value = 'Alternative Summer Fest';
    campoFecha.value = '2027-07-20';
    campoGenero.value = 'rock';
    campoAforo.value = '25000';

    radioVip.checked = true;
    radioVip.dispatchEvent(new Event('change'));
    campoSuplementoVip.value = '45.50';

    campoLicencia.value = 'FEST-2027-SUMM';
    campoTelefono.value = '699112233';
    campoCif.value = 'B12345674'; // CIF válido con control 4

    // Añadir dos patrocinadores dinámicos
    btnAgregarPatrocinador.click();
    btnAgregarPatrocinador.click();
    const inputsPatrocinadores = document.querySelectorAll('.input-patrocinador');
    inputsPatrocinadores[0].value = 'Monster Energy';
    inputsPatrocinadores[1].value = 'Vans';

    // Enviar formulario
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    // Comprobar que redirige a listado.html
    expect(navegar).toHaveBeenCalledWith('listado.html');

    // Comprobar datos exactos guardados en el almacenamiento del usuario activo
    const jornadasGuardadas = obtenerJornadas(usuarioActivo.nombre, almacenJornadas);
    expect(jornadasGuardadas).toHaveLength(1);

    const jornada = jornadasGuardadas[0];
    expect(jornada.id).toBeDefined();
    expect(jornada.nombreJornada).toBe('Alternative Summer Fest');
    expect(jornada.fechaEvento).toBe('2027-07-20');
    expect(jornada.generoMusical).toBe('rock');
    expect(jornada.aforoMaximo).toBe(25000);
    expect(jornada.tipoAcceso).toBe('vip');
    expect(jornada.suplementoVip).toBe(45.5);
    expect(jornada.codigoLicencia).toBe('FEST-2027-SUMM');
    expect(jornada.telefonoContacto).toBe('699112233');
    expect(jornada.cifPromotora).toBe('B12345674');
    expect(jornada.patrocinadores).toEqual(['Monster Energy', 'Vans']);
  });

  it('modo edición carga datos existentes y permite actualizarlos', () => {
    const jornadaPrevia = guardarJornada(
      usuarioActivo.nombre,
      {
        nombreJornada: 'Jornada Inicial',
        fechaEvento: '2027-06-15',
        generoMusical: 'indie',
        aforoMaximo: 12000,
        tipoAcceso: 'general',
        suplementoVip: null,
        codigoLicencia: 'FEST-2027-INDI',
        telefonoContacto: '611223344',
        cifPromotora: '12345678Z',
        patrocinadores: ['Gibson'],
      },
      almacenJornadas,
    );

    // Iniciar en modo edición con el id previo
    iniciarPaginaFicha(document, {
      almacenSesion,
      almacenJornadas,
      navegar,
      idJornada: jornadaPrevia.id,
    });

    const campoNombre = document.querySelector('#campo-nombre-jornada');
    const campoAforo = document.querySelector('#campo-aforo-maximo');
    const inputsPatrocinadores = document.querySelectorAll('.input-patrocinador');

    expect(campoNombre.value).toBe('Jornada Inicial');
    expect(campoAforo.value).toBe('12000');
    expect(inputsPatrocinadores).toHaveLength(1);
    expect(inputsPatrocinadores[0].value).toBe('Gibson');

    // Modificar datos y enviar
    campoNombre.value = 'Jornada Inicial Modificada';
    campoAforo.value = '15000';
    const form = document.querySelector('#form-jornada');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(navegar).toHaveBeenCalledWith('listado.html');

    const actualizadas = obtenerJornadas(usuarioActivo.nombre, almacenJornadas);
    expect(actualizadas).toHaveLength(1);
    expect(actualizadas[0].id).toBe(jornadaPrevia.id);
    expect(actualizadas[0].nombreJornada).toBe('Jornada Inicial Modificada');
    expect(actualizadas[0].aforoMaximo).toBe(15000);
  });
});
