# BeatFest Manager · Organizador de Festivales y Escenarios

<!-- Sprint 2: la insignia de tu workflow, con tu organización y tu repositorio. -->
![Integración continua](https://github.com/<organización>/<repositorio>/actions/workflows/ci.yml/badge.svg)

## Mi proyecto

**BeatFest Manager** es una aplicación web para directores artísticos, promotores y coordinadores de festivales musicales que permite diseñar, organizar y gestionar carteles de eventos (*lineups*), escenarios y jornadas de conciertos. Cuenta con una mecánica interactiva de **Drag & Drop** para asignar y reorganizar artistas entre escenarios y horarios, control de accesos VIP y patrocinadores.

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

### La entidad: Jornada de Festival

| Campo | Control | Obligatorio | Regla de validación | Mensaje si no se cumple |
|-------|---------|:-----------:|---------------------|-------------------------|
| `nombreJornada` | Texto (`<input type="text">`) | Sí | Entre 4 y 40 caracteres alfanuméricos | El nombre debe tener entre 4 y 40 caracteres |
| `fechaEvento` | Fecha (`<input type="date">`) | Sí | Fecha igual o posterior a la actual | La fecha no puede ser anterior a hoy |
| `generoMusical` | Desplegable (`<select>`) | Sí | Debe seleccionar una opción válida | Selecciona un género musical principal |
| `aforoMaximo` | Número (`<input type="number">`) | Sí | Entre 50 y 100.000 asistentes | El aforo debe estar entre 50 y 100.000 personas |
| `tipoAcceso` | Botones de opción (`<input type="radio">`) | Sí | Selección obligatoria (General, VIP Backstage o Barra Libre) | Debes seleccionar un tipo de acceso |
| `suplementoVip` *(campo condicional)* | Número (`<input type="number">`) | Sí (si VIP) | Número positivo mayor o igual a 0 | El suplemento VIP debe ser un importe válido |
| `patrocinadores` *(grupo dinámico, mín 0, máx 3)* | Texto (`<input type="text">`) | No | Entre 2 y 30 caracteres por patrocinador | El nombre del patrocinador debe tener entre 2 y 30 caracteres |
| `codigoLicencia` | Texto (`<input type="text">`) | Sí | Expresión regular: `^FEST-\d{4}-[A-Z0-9]{4}$` | Formato requerido: FEST-AAAA-XXXX |
| `telefonoContacto` | Teléfono (`<input type="tel">`) | Sí | Expresión regular española: `^[67]\d{8}$` | Debe ser un teléfono móvil español válido (9 dígitos) |
| `cifPromotora` | Texto (`<input type="text">`) | Sí | Formato CIF/DNI y validación algorítmica de control | El identificador de la promotora no es válido |

### El registro de usuarios

| Campo | Control | Regla | Mensaje |
|-------|---------|-------|---------|
| `nombreUsuario` | Texto (`<input type="text">`) | Entre 3 y 20 caracteres alfanuméricos (`^[a-zA-Z0-9_-]{3,20}$`) y no ocupado | Debe tener entre 3 y 20 caracteres (solo letras, números y guiones) y estar libre |
| `correo` | Correo (`<input type="email">`) | Formato de correo electrónico estándar | Introduce un correo electrónico válido |
| `clave` | Contraseña (`<input type="password">`) | Mínimo 8 caracteres, al menos una mayúscula (`\p{Lu}`), una minúscula (`\p{Ll}`) y un número (`\d`) | La contraseña debe cumplir los requisitos de seguridad |
| `repetirClave` | Contraseña (`<input type="password">`) | Debe coincidir exactamente con `clave` | Las contraseñas no coinciden |
| `aceptarTerminos` | Casilla (`<input type="checkbox">`) | Casilla marcada obligatoriamente | Debes aceptar los términos y condiciones del festival |

### Páginas

| Página | Acceso | Qué hace |
|--------|--------|----------|
| `index.html` | Pública | Inicio de sesión con usuario y contraseña (redirige al listado si ya hay sesión activa). |
| `registro.html` | Pública | Registro de nuevos promotores/usuarios con validación en tiempo real y requisitos visuales. El primer usuario registrado es Administrador. |
| `listado.html` | Privada (Usuarios y Admins) | Catálogo de jornadas de festivales con buscador *debounce*, paginación, edición y borrado con confirmación en `<dialog>`. |
| `ficha.html` | Privada (Usuarios y Admins) | Alta y edición de jornadas con campo condicional, grupo dinámico de patrocinadores y tablero drag & drop. |
| `usuarios.html` | Privada (Solo Administradores) | Listado y gestión de usuarios registrados para asignar/revocar el rol de administrador, con protección contra auto-bloqueo. |

## Arquitectura y módulos

<!-- 1. Un diagrama (Mermaid) de tus módulos y de qué usa cada uno.
     2. Tabla con cada módulo: qué hace, si usa el DOM y qué exporta.
     3. Cómo están hechos tus objetos (funciones fábrica o clases) y qué patrones de diseño usas
        (al menos dos): dónde y por qué.
     4. Cómo reciben las páginas lo que necesitan (almacenamiento, sesión, navegación) y por qué así
        se pueden probar.
     5. Qué documenta tu JSDoc y cómo se genera la documentación (`npm run docs`). -->

## Cómo ejecutarlo

<!-- Cómo abrir el proyecto en el Dev Container y ver la web, y cómo pasar los tests, la cobertura,
     las pruebas de extremo a extremo, ESLint y Prettier, generar la documentación y preparar la web
     publicable (`npm run build`). -->

## Almacenamiento y sesión

<!-- 1. Tabla con cada clave que usas: dónde está (localStorage o sessionStorage), qué guarda y un
         ejemplo de su contenido.
     2. Por qué cada dato va donde va.
     3. Cómo guardas el rol y cómo proteges las páginas por sesión y por rol.
     4. Por qué este inicio de sesión NO es seguro: qué podría hacer alguien con las DevTools y cómo
         se hace en una aplicación real. -->

## Funcionalidad y formularios

<!-- Una subsección por parte de la aplicación (sesión y registro, listado y paginación, ficha,
     zona de administración): qué hace y cómo lo has resuelto. Incluye:
     - cómo lees los datos (FormData: get, getAll), cómo creas y numeras el grupo dinámico, cómo
       funciona el campo condicional, qué atributos pones desde el código y cómo rellenas el
       formulario al editar;
     - la validación: cuándo validas cada campo, de dónde salen los mensajes (validity,
       setCustomValidity y tus validadores), qué haces para que los errores sean accesibles y cómo
       evitas el doble envío;
     - las expresiones regulares: tabla con cada una, en qué validador está, qué acepta (un ejemplo)
       y qué significan sus partes y sus flags; qué parte de la validación hace la expresión y qué
       parte el código. -->

## Eventos

### Eventos en el HTML

<!-- Qué consigues con el HTML sin escribir oyentes (envío con Intro, novalidate y los atributos de
     validación, dialog, label for…) y por qué no usas atributos on…. -->

### Tipos de eventos

<!-- Tabla con los eventos que usas y por qué has elegido cada uno frente a otros parecidos
     (submit frente a click, input frente a change, blur frente a focusout…). -->

### Propagación

<!-- 1. Tabla con TODOS tus oyentes: evento, dónde lo registras, en qué fase actúa
         (captura, objetivo o burbuja) y para qué.
     2. Dónde usas la delegación y qué ganas con ella.
     3. Tu uso de la captura y por qué no servía la burbuja.
     4. Si usas stopPropagation, por qué. -->

## Pruebas y cobertura

<!-- 1. Tabla de la pirámide: tipo (unitario, de integración o de extremo a extremo), fichero,
        qué prueba y cuántos tests tiene. Por qué cada cosa se prueba en ese nivel y no en otro.
     2. Cómo simulas al usuario (eventos, requestSubmit), los servicios (AlmacenFalso, el resumen
        de la contraseña, la navegación) y el tiempo (temporizadores falsos).
     3. Cómo se ejecutan las mismas pruebas de extremo a extremo con serve y contra la web
        desplegada (BASE_URL).
     4. Pega la salida de `npm run coverage` (con el resumen de la cobertura) y de `npm run e2e`.
        Explica qué umbral has puesto, a qué ficheros y qué queda sin probar y por qué. -->

## Integración continua

### ESLint y Prettier

En `eslint.config.js` se han añadido las siguientes reglas adicionales que no venían por defecto en la plantilla:

1. **`curly: ['error', 'all']`**:
   - *Qué comprueba:* Exige que todas las sentencias de control (`if`, `else`, `for`, `while`) lleven obligatoriamente llaves `{}` que delimiten su cuerpo, incluso si constan de una sola instrucción.
   - *Por qué la queremos:* Previene fallos clásicos de ejecución por indentación engañosa (como el célebre fallo *goto fail* de SSL) y garantiza claridad absoluta al añadir nuevas líneas de código en bloques de control.

2. **`camelcase: ['error', { properties: 'never' }]`**:
   - *Qué comprueba:* Obliga a que los nombres de variables, parámetros y funciones sigan la convención estándar camelCase de JavaScript.
   - *Por qué la queremos:* Mantiene una homogeneidad total en la base de código, diferenciando claramente variables y funciones de clases (`PascalCase`) y constantes globales (`SCREAMING_SNAKE_CASE`).

3. **`'prefer-template': 'error'`**:
   - *Qué comprueba:* Reclama el uso de plantillas de cadena (*template literals* con backticks y `${}`) en lugar de concatenaciones mediante el operador `+`.
   - *Por qué la queremos:* Mejora significativamente la legibilidad del código al incrustar expresiones y variables, reduciendo errores con espacios y conversiones accidentales.

4. **`'no-alert': 'error'`**:
   - *Qué comprueba:* Prohíbe terminantemente el uso de funciones emergentes síncronas del navegador (`alert`, `confirm`, `prompt`).
   - *Por qué la queremos:* Garantiza que toda la interacción con el usuario sea accesible, moderna y no bloquee el hilo principal del navegador, utilizando nuestro sistema de avisos propio en el DOM y ventanas modales accesibles con `<dialog>`.

### El workflow

<!-- Sprints 1 y 2. Qué hace ci.yml: cuándo se ejecuta, la tabla de sus trabajos y por qué están en
     ese orden, qué artefactos sube y para qué sirven, y qué hace concurrency. -->

| Trabajo | Espera a | Pasos | Artefacto |
|---------|----------|-------|-----------|
| `Calidad` | — | | — |
| `Tests` | | | |
| `E2E` | | | |

**Ejecución en verde con sus artefactos:** <!-- enlace -->

## Despliegue continuo

<!-- Sprint 3. 1. Cómo has configurado Vercel: build, carpeta de salida, protección de los
     despliegues y Deployment Checks (qué comprobaciones exige y por qué).
     2. Qué hacen despliegue.yml y release.yml, y qué comprueba tu prueba de humo.
     3. El camino de un cambio, con tus palabras: desde tu git push en una rama hasta que se ve en
     la web, qué se comprueba en cada paso y qué pasa si algo falla. -->

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

| Evidencia | Enlace | Captura |
|-----------|--------|---------|
| *Pull request* con su vista previa y `E2E desplegado` | <!-- enlace a la pull request --> | `img/pr-comprobaciones.png` |
| Versión retenida por Vercel | <!-- enlace a la ejecución en rojo --> | `img/vercel-retenido.png` |
| Release `v1.0` | <!-- enlace a la Release --> | — |

<!-- Qué rompiste a propósito para la versión retenida, qué viste en Vercel y cómo comprobaste que la
     web seguía con la versión anterior. -->

## Organización del trabajo

### Definición de Hecho (Definition of Done)

Para considerar una tarea o funcionalidad completada e integrada, debe satisfacer rigurosamente cada uno de los siguientes puntos:

- [ ] **Calidad de código:** El código no utiliza variables globales, emplea `const` y `let`, comparaciones estrictas (`===`), no contiene `innerHTML` para renderizar datos dinámicos y pasa `npm run lint` sin advertencias ni errores.
- [ ] **Formato unificado:** El código y los archivos de configuración siguen las reglas de estilo y pasan `npm run format:check`.
- [ ] **Pruebas automatizadas:** Dispone de sus tests correspondientes (unitarios, integración o E2E según el nivel de la pirámide) y todos los tests pasan con `npm test`.
- [ ] **Cobertura verificada:** Las funciones puras y validadores cumplen o superan el umbral mínimo del 90% medido con `npm run coverage`.
- [ ] **Accesibilidad y UX:** Los campos y botones disponen de sus etiquetas `label`, `aria-describedby`, estados `aria-invalid` y roles correspondientes, y los formularios tienen foco automático en el primer error en caso de fallo.
- [ ] **Prueba manual en navegador:** Funciona correctamente en el Dev Container en ventana privada de incógnito (almacenamiento limpio).
- [ ] **Control de versiones:** Los cambios se realizan en su rama correspondiente (`feature branch`), con commits pequeños y descriptivos, y la integración en `main` se realiza mediante *Pull Request* con el workflow de CI en verde.

### Sprints

| Sprint | *Tag* | Qué incluye | Reflexión |
|--------|-------|-------------|-----------|
| 1 | `v0.1` | Gestión de usuarios, sesión, roles, validaciones de registro, sistema de avisos y primera integración continua con ESLint y tests unitarios. | La separación en módulos independientes y la inyección de dependencias para el almacenamiento facilitaron crear tests rápidos y con 100% de cobertura en funciones puras. La validación con captura de `blur` y el feedback en tiempo real de la contraseña funcionaron a la perfección. Como aprendizaje, el cálculo asíncrono del hash obligó a blindar el formulario contra dobles envíos. Para el Sprint 2 diseñaré primero el flujo de eventos del CRUD y la delegación en el DOM antes de escribir las plantillas. |
| 2 | `v0.2` | CRUD completo de festivales, drag & drop de artistas, buscador con debounce, paginación, panel de administración y CI completo con E2E y cobertura. | |
| 3 | `v1.0` | Despliegue continuo en Vercel, vistas previas probadas, prueba de humo, release en GitHub y documentación JSDoc completa. | |

**Tablero de Trello:** [BeatFest Manager en Trello](https://trello.com/b/LfmqfxHl/beatfest-manager) (compartido con el profesor)

**Blog del proyecto:** [blog/README.md](blog/README.md)

### Ramas y versiones

Se utilizará una estrategia de ramas por funcionalidad (*feature branches*). Para incorporar los cambios a `main` se utilizará **`merge`** (creando commit de fusión sin avance rápido / merge commit), ya que preserva el historial cronológico exacto de desarrollo y permite identificar con claridad en el grafo de Git cuándo se creó, probó y fusionó cada funcionalidad junto con su Pull Request correspondiente.

#### Configuración de `.gitignore`
El archivo `.gitignore` excluye:
- `node_modules/`: Dependencias externas instalables mediante `npm ci`.
- `dist/`: Directorio generado por el comando `npm run build` para la publicación en Vercel.
- `coverage/`, `playwright-report/`, `test-results/`: Archivos temporales e informes generados durante la ejecución de las suites de prueba.
- `docs/`: Documentación estática autogenerada con JSDoc.
- Archivos residuales del sistema (`.DS_Store`, `Thumbs.db`, `*.log`).

| Rama | Funcionalidad | *Pull request* |
|------|---------------|----------------|
| `sprint-1-auth` | Usuarios, sesión, roles, avisos, páginas base y CI paso 1 | |

**Versión de entrega:** `v1.0`
