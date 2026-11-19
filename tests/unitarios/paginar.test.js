import { describe, expect, it } from 'vitest';
import { paginar } from '../../js/logica/paginar.js';

describe('paginar (función pura de paginación)', () => {
  const listaPrueba = ['jornada-1', 'jornada-2', 'jornada-3', 'jornada-4', 'jornada-5'];

  it('devuelve la primera página correctamente', () => {
    const resultado = paginar(listaPrueba, 1, 2);
    expect(resultado.pagina).toBe(1);
    expect(resultado.totalPaginas).toBe(3);
    expect(resultado.totalElementos).toBe(5);
    expect(resultado.elementos).toEqual(['jornada-1', 'jornada-2']);
  });

  it('devuelve la última página correctamente con el residuo de elementos', () => {
    const resultado = paginar(listaPrueba, 3, 2);
    expect(resultado.pagina).toBe(3);
    expect(resultado.totalPaginas).toBe(3);
    expect(resultado.totalElementos).toBe(5);
    expect(resultado.elementos).toEqual(['jornada-5']);
  });

  it('corrige una página que no existe por exceso a la última válida', () => {
    const resultado = paginar(listaPrueba, 999, 2);
    expect(resultado.pagina).toBe(3);
    expect(resultado.totalPaginas).toBe(3);
    expect(resultado.elementos).toEqual(['jornada-5']);
  });

  it('corrige una página que no existe por defecto (0 o negativa) a la página 1', () => {
    const resultadoCero = paginar(listaPrueba, 0, 2);
    expect(resultadoCero.pagina).toBe(1);
    expect(resultadoCero.elementos).toEqual(['jornada-1', 'jornada-2']);

    const resultadoNegativo = paginar(listaPrueba, -5, 2);
    expect(resultadoNegativo.pagina).toBe(1);
    expect(resultadoNegativo.elementos).toEqual(['jornada-1', 'jornada-2']);
  });

  it('gestiona correctamente una lista vacía', () => {
    const resultado = paginar([], 1, 5);
    expect(resultado.pagina).toBe(1);
    expect(resultado.totalPaginas).toBe(1);
    expect(resultado.totalElementos).toBe(0);
    expect(resultado.elementos).toEqual([]);
  });

  it('gestiona tipos no numéricos o porPagina inválido aplicando valores por defecto', () => {
    const resString = paginar(listaPrueba, '2', 2);
    expect(resString.pagina).toBe(2);
    expect(resString.elementos).toEqual(['jornada-3', 'jornada-4']);

    const resPorPaginaInvalido = paginar(listaPrueba, 1, -1);
    expect(resPorPaginaInvalido.elementos).toHaveLength(5); // porPagina por defecto es 5

    const resListaNoArray = paginar(null, 1, 5);
    expect(resListaNoArray.elementos).toEqual([]);
    expect(resListaNoArray.totalElementos).toBe(0);
  });
});
