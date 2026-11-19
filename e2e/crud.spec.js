import { test, expect } from '@playwright/test';
import { registrarse, crearJornada } from './helpers.js';

test.describe('Recorrido E2E: CRUD completo de festivales', () => {
  test('dar de alta un registro, editarlo, borrarlo con confirmación y comprobar persistencia tras recargar', async ({
    page,
  }) => {
    // 1. Iniciar sesión registrando un promotor
    await registrarse(page, {
      nombre: 'promotor_crud',
      correo: 'crud@beatfest.es',
      clave: 'BeatFest2026!',
    });

    // 2. Dar de alta una nueva jornada de festival
    const datosJornada = {
      nombre: 'Opening Stage Rock 2027',
      fecha: '2027-08-20',
      genero: 'rock',
      aforo: 25000,
      tipoAcceso: 'vip',
      suplemento: 40.0,
      licencia: 'FEST-2027-ROCK',
      telefono: '612345678',
      cif: 'B12345674',
      patrocinadores: ['Vans', 'Monster'],
    };

    await crearJornada(page, datosJornada);

    // Comprobar que aparece en listado.html
    const tarjetaJornada = page.locator('.item-jornada').first();
    await expect(tarjetaJornada).toBeVisible();
    await expect(tarjetaJornada.getByText('Opening Stage Rock 2027')).toBeVisible();
    await expect(tarjetaJornada.getByText('25.000')).toBeVisible();

    // 3. Comprobar que lo guardado sigue al recargar la página (persistencia en localStorage)
    await page.reload();
    await expect(page.getByText('Opening Stage Rock 2027')).toBeVisible();

    // 4. Editar el registro existente
    await tarjetaJornada.getByRole('link', { name: /editar/i }).click();
    await page.waitForURL('**/ficha.html?id=*');

    // Modificar el nombre y el aforo
    const campoNombre = page.getByLabel(/nombre de la jornada/i);
    await campoNombre.fill('Opening Stage Rock 2027 (Renovado)');
    const campoAforo = page.getByLabel(/aforo máximo/i);
    await campoAforo.fill('32000');

    await page.getByRole('button', { name: /guardar cambios/i }).click();
    await page.waitForURL('**/listado.html*');

    // Comprobar que los cambios se reflejan en el listado
    await expect(page.getByText('Opening Stage Rock 2027 (Renovado)')).toBeVisible();
    await expect(page.getByText('32.000')).toBeVisible();

    // 5. Borrar el registro con confirmación en el <dialog>
    await page.getByRole('button', { name: /borrar/i }).click();

    const dialog = page.locator('#dialog-confirmar-borrado');
    await expect(dialog).toBeVisible();

    // Confirmar la eliminación dentro del diálogo
    await page.getByRole('button', { name: /confirmar borrado/i }).click();
    await expect(dialog).toBeHidden();

    // Comprobar que ya no aparece y se muestra el mensaje de listado vacío
    await expect(page.getByText('Opening Stage Rock 2027 (Renovado)')).toBeHidden();
    await expect(page.locator('#mensaje-vacio')).toBeVisible();

    // Comprobar que tras recargar sigue vacío
    await page.reload();
    await expect(page.locator('#mensaje-vacio')).toBeVisible();
  });
});
