/**
 * Funciones de ayuda reutilizables para las pruebas de extremo a extremo con Playwright.
 */
import { expect } from '@playwright/test';

/**
 * Registra un nuevo usuario en la aplicación y espera la navegación a listado.html.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} credenciales
 * @param {string} credenciales.nombre
 * @param {string} credenciales.correo
 * @param {string} credenciales.clave
 */
export async function registrarse(page, { nombre, correo, clave }) {
  await page.goto('/registro.html');
  await page.getByLabel('Nombre de usuario').fill(nombre);
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña de acceso').fill(clave);
  await page.getByLabel('Confirmar contraseña').fill(clave);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /finalizar registro|completar registro/i }).click();

  await page.waitForURL('**/listado.html*');
  await expect(page).toHaveURL(/listado\.html/);
}

/**
 * Inicia sesión con credenciales existentes y espera la navegación a listado.html.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} credenciales
 * @param {string} credenciales.nombre
 * @param {string} credenciales.clave
 */
export async function iniciarSesion(page, { nombre, clave }) {
  await page.goto('/index.html');
  await page.getByLabel('Nombre de usuario').fill(nombre);
  await page.getByLabel('Contraseña').fill(clave);
  await page.getByRole('button', { name: /entrar al festival|entrar al panel|entrar/i }).click();

  await page.waitForURL('**/listado.html*');
  await expect(page).toHaveURL(/listado\.html/);
}

/**
 * Cierra la sesión activa pulsando el botón Salir de la cabecera.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function cerrarSesion(page) {
  await page.getByRole('button', { name: /salir|cerrar sesión/i }).click();
  await page.waitForURL('**/index.html*');
  await expect(page).toHaveURL(/index\.html/);
}

/**
 * Rellena y envía el formulario de ficha para crear una nueva jornada.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} datos
 */
export async function crearJornada(page, datos) {
  await page.goto('/ficha.html');

  await page.getByLabel(/nombre de la jornada/i).fill(datos.nombre);
  await page.getByLabel(/fecha del evento/i).fill(datos.fecha);
  await page.getByLabel(/género musical principal/i).selectOption(datos.genero);
  await page.getByLabel(/aforo máximo/i).fill(String(datos.aforo));

  if (datos.tipoAcceso === 'vip') {
    await page.getByLabel('VIP Backstage').check();
    if (datos.suplemento !== undefined) {
      await page.getByLabel(/suplemento vip/i).fill(String(datos.suplemento));
    }
  } else if (datos.tipoAcceso === 'barra_libre') {
    await page.getByLabel('Barra Libre').check();
  }

  await page.getByLabel(/código de licencia/i).fill(datos.licencia);
  await page.getByLabel(/teléfono móvil/i).fill(datos.telefono);
  await page.getByLabel(/cif \/ dni/i).fill(datos.cif);

  if (Array.isArray(datos.patrocinadores)) {
    for (const pat of datos.patrocinadores) {
      await page.getByRole('button', { name: /\+ añadir patrocinador/i }).click();
      const inputs = page.locator('.input-patrocinador');
      const ultimo = inputs.last();
      await ultimo.fill(pat);
    }
  }

  await page.getByRole('button', { name: /guardar jornada/i }).click();
  await page.waitForURL('**/listado.html*');
  await expect(page).toHaveURL(/listado\.html/);
}
