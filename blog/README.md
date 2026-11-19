# Blog del proyecto

## 05/11/2026 · Sprint 1 · Autenticación, Roles, Avisos y Flujo de Calidad

### Dificultades y cómo las resolví

1. **La fase de captura en la validación al salir de los campos (`blur`):**  
   Al implementar la validación de formularios al perder el foco, descubrí que el evento nativo `blur` no sube por burbuja (*bubbling*) a través del árbol del DOM hacia el elemento `<form>`, a diferencia de otros eventos como `input` o `change`. Al principio consideré asociar un oyente independiente a cada campo del formulario, pero esto duplicaba código y dificultaba la gestión de campos creados dinámicamente. La solución elegante fue aprovechar la fase de captura de los eventos del DOM registrando el oyente en el propio formulario pasando `true` como tercer argumento en `formulario.addEventListener('blur', callback, true)`. De este modo, el evento es interceptado cuando desciende desde `window` y `document` hacia el campo en la fase de captura, permitiendo centralizar toda la validación en un único oyente.

2. **Prevención de doble envío durante el cálculo asíncrono del resumen hash:**  
   La función criptográfica `resumirClave` de la Web Crypto API devuelve una `Promise` que resuelve de forma asíncrona. Si el usuario hacía doble clic rápido en el botón de envío o pulsaba `Intro` repetidamente mientras se calculaba el hash SHA-256, se desencadenaban múltiples procesos de registro o inicio de sesión en paralelo. Para resolverlo, implementé un estado de envío (`enviando = true`) combinado con el atributo `disabled` en el botón de submit dentro de un bloque `try...finally`. De esta manera, cualquier pulsación posterior queda inmediatamente descartada hasta que la operación asíncrona termina de completarse.

3. **Tolerancia a fallos frente a datos corruptos en el almacenamiento:**  
   Si en `localStorage` o `sessionStorage` se guardaba un valor dañado o si alguien alteraba manualmente el contenido desde las DevTools dejando un JSON incompleto o inválido, la llamada a `JSON.parse` arrojaba una excepción `SyntaxError` no capturada que provocaba un fallo total en la carga de la página. Lo solucioné abstrayendo el acceso al almacenamiento en una función pura `leer(almacen, clave, valorPorDefecto)` en `js/datos/almacen.js`, la cual envuelve el parseo en un bloque `try/catch` y devuelve un valor seguro (como `[]` o `null`) en caso de error, asegurando que la aplicación sea completamente resiliente.

---

### Problemas conceptuales

1. **Diferencia entre pruebas unitarias y pruebas de integración:**  
   Antes de este sprint tendía a confundir ambos niveles de prueba. Ahora entiendo con total claridad su separación en la pirámide de testing:
   - Un **test unitario** comprueba una función pura y aislada de toda dependencia externa (sin DOM, sin navegador y sin almacenamiento real). Por ejemplo, en `tests/unitarios/validadores.test.js` se prueba que `validarNombreUsuario('abc')` devuelva `{ valido: true }` evaluando únicamente su lógica interna.
   - Un **test de integración** comprueba la interacción conjunta entre varias piezas de la arquitectura en un entorno de navegador simulado (`happy-dom`). En `tests/integracion/auth.test.js`, cargamos el HTML real de `index.html` con `cargarPagina`, disparamos eventos reales del DOM con `escribir` y `requestSubmit`, y comprobamos que el módulo de página, los validadores y `AlmacenFalso` colaboren correctamente para navegar a `listado.html`.

2. **Por qué la sesión va en `sessionStorage` y los usuarios en `localStorage`:**  
   En `localStorage` los datos persisten sin fecha de caducidad entre pestañas, ventanas y reinicios del navegador. Es el lugar idóneo para conservar los usuarios registrados y los registros del CRUD. Por el contrario, `sessionStorage` tiene un ciclo de vida estrictamente acotado a la pestaña activa: si el usuario cierra la pestaña o abre una ventana nueva, la sesión no existe y debe autenticarse de nuevo. Esto aísla las sesiones y simula el comportamiento natural de una sesión web sin backend.

3. **Qué hace `needs` en GitHub Actions:**  
   En el archivo de workflow `.github/workflows/ci.yml`, cada trabajo (*job*) se ejecuta por defecto en paralelo en máquinas virtuales independientes de Ubuntu. Al añadir `needs: calidad` al trabajo `Tests`, GitHub Actions impone un orden estricto de ejecución: `Tests` no arranca hasta que `Calidad` haya finalizado exitosamente en verde. Esto ahorra tiempo y consumo de recursos, ya que si el código tiene fallos de sintaxis o formato no tiene sentido malgastar minutos ejecutando las pruebas.
