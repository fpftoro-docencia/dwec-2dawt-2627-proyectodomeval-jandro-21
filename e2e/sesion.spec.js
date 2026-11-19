import { test, expect } from '@playwright/test';
import { registrarse, iniciarSesion, cerrarSesion } from './helpers.js';

test.describe('Recorrido E2E: Ciclo completo de sesión y roles', () => {
  test('registrarse como primer usuario (obtiene rol admin y ve menú Promotores), cerrar sesión y volver a entrar', async ({
    page,
  }) => {
    const credenciales = {
      nombre: 'promotor_jefe',
      correo: 'director@beatfest.es',
      clave: 'BeatFest2026!',
    };

    // 1. Registro del primer usuario en la plataforma
    await registrarse(page, credenciales);

    // 2. Verificar que al ser el primer usuario, se le asigna rol administrador
    // El enlace 'Promotores' en el menú de navegación debe ser visible
    const enlaceUsuarios = page.locator('#enlace-nav-usuarios');
    await expect(enlaceUsuarios).toBeVisible();

    // Comprobar la etiqueta del rol en la cabecera
    await expect(page.locator('#cabecera-rol')).toHaveText(/ADMINISTRADOR/i);
    await expect(page.locator('#cabecera-usuario')).toHaveText('promotor_jefe');

    // Navegar a la página privada de administración mediante el menú
    await enlaceUsuarios.click();
    await page.waitForURL('**/usuarios.html*');
    await expect(page).toHaveURL(/usuarios\.html/);

    // 3. Cerrar sesión
    await cerrarSesion(page);
    await expect(page).toHaveURL(/index\.html/);

    // 4. Volver a iniciar sesión con las credenciales registradas
    await iniciarSesion(page, credenciales);

    // Comprobar que volvemos a estar en listado.html con la sesión activa
    await expect(page.locator('#cabecera-usuario')).toHaveText('promotor_jefe');
    await expect(page.locator('#enlace-nav-usuarios')).toBeVisible();
  });
});
