import { describe, it, expect, beforeEach } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  obtenerTemaActual,
  aplicarTema,
  conmutarTema,
  iniciarTema,
} from '../../js/componentes/tema.js';

describe('Gestor de Tema Visual (tema.js)', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
    document.documentElement.removeAttribute('data-theme');
    document.body.innerHTML = '';
  });

  it('devuelve "dark" por defecto si no hay nada guardado en el almacén', () => {
    const tema = obtenerTemaActual(almacen);
    expect(tema).toBe('dark');
  });

  it('devuelve el tema guardado previamente en el almacén', () => {
    almacen.setItem('beatfest_theme', 'light');
    expect(obtenerTemaActual(almacen)).toBe('light');

    almacen.setItem('beatfest_theme', 'dark');
    expect(obtenerTemaActual(almacen)).toBe('dark');
  });

  it('aplica el atributo data-theme al elemento raíz y actualiza botones', () => {
    document.body.innerHTML = `
      <button class="btn-theme-toggle" type="button"></button>
    `;

    aplicarTema('light', document, almacen);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(almacen.getItem('beatfest_theme')).toBe('light');

    const boton = document.querySelector('.btn-theme-toggle');
    expect(boton.getAttribute('aria-pressed')).toBe('true');
  });

  it('conmutarTema alterna entre modo oscuro y modo claro', () => {
    aplicarTema('dark', document, almacen);
    const nuevoTema = conmutarTema(document, almacen);

    expect(nuevoTema).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    const temaPosterior = conmutarTema(document, almacen);
    expect(temaPosterior).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('iniciarTema inicializa el tema y asocia eventos a los botones de cambio de tema', () => {
    document.body.innerHTML = `
      <button id="btn-prueba" class="btn-theme-toggle" type="button"></button>
    `;

    iniciarTema(document, almacen);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    const boton = document.querySelector('#btn-prueba');
    boton.click();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(almacen.getItem('beatfest_theme')).toBe('light');
  });
});
