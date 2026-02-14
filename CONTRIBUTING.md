# Contribuir a Planning GameXP

¡Nos encanta recibir tus contribuciones! Queremos que contribuir a Planning GameXP sea lo más fácil y transparente posible, ya sea para:

- Reportar un bug
- Discutir el estado actual del código
- Enviar un fix
- Proponer nuevas funcionalidades
- Convertirte en mantenedor

## Proceso de Desarrollo

Usamos GitHub para alojar el código, hacer seguimiento de issues y solicitudes de funcionalidades, así como para aceptar pull requests.

## Pull Requests

Los pull requests son la mejor forma de proponer cambios en el código. Aceptamos activamente tus pull requests:

1. Haz fork del repositorio y crea tu rama desde `main`.
2. Si has añadido código que debería ser testeado, añade tests.
3. Si has cambiado APIs, actualiza la documentación.
4. Asegúrate de que la suite de tests pase.
5. Asegúrate de que tu código pase el linting.
6. ¡Envía ese pull request!

## Cualquier contribución que hagas estará bajo la Licencia de Software MIT

En resumen, cuando envías cambios de código, se entiende que tus envíos están bajo la misma [Licencia MIT](http://choosealicense.com/licenses/mit/) que cubre el proyecto. Siéntete libre de contactar con los mantenedores si esto te preocupa.

## Reportar bugs usando el [issue tracker](https://github.com/AgilePlanning-io/planning-game-xp/issues) de GitHub

Usamos issues de GitHub para hacer seguimiento de bugs públicos. Reporta un bug [abriendo un nuevo issue](https://github.com/AgilePlanning-io/planning-game-xp/issues/new); ¡es así de fácil!

## Escribe reportes de bugs con detalle, contexto y código de ejemplo

**Buenos Reportes de Bugs** tienden a tener:

- Un resumen rápido y/o contexto
- Pasos para reproducir
  - ¡Sé específico!
  - Proporciona código de ejemplo si puedes
- Qué esperabas que ocurriera
- Qué ocurrió realmente
- Notas (posiblemente incluyendo por qué crees que puede estar pasando, o cosas que intentaste y no funcionaron)

A la gente le *encantan* los reportes de bugs detallados. No es broma.

## Configuración del Entorno de Desarrollo

### Prerrequisitos

- Node.js 18.x o superior
- npm o yarn
- Cuenta y proyecto de Firebase
- Git

### Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/AgilePlanning-io/planning-game-xp.git
cd PlanningGameXP
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp .env.example .env.dev
# Edita .env.dev con tu configuración de Firebase
```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

### Estructura del Proyecto

```
├── public/               # Assets estáticos y JavaScript del lado cliente
│   ├── js/              # Módulos JavaScript y componentes
│   │   ├── wc/          # Web Components (LitElement)
│   │   ├── services/    # Capa de servicios
│   │   ├── utils/       # Funciones de utilidad
│   │   └── controllers/ # Controladores de la aplicación
│   └── images/          # Imágenes estáticas
├── src/                 # Archivos fuente de Astro
│   ├── pages/           # Páginas de Astro
│   ├── layouts/         # Layouts de páginas
│   └── lib/             # Librerías compartidas
├── functions/           # Cloud Functions de Firebase
└── tests/               # Archivos de tests
```

### Stack Tecnológico

- **Framework Frontend**: Astro 5.x
- **Web Components**: LitElement
- **Base de Datos**: Firebase Realtime Database
- **Autenticación**: Firebase Auth (Proveedor Microsoft)
- **Almacenamiento**: Firebase Storage
- **Testing**: Vitest + jsdom
- **Herramienta de Build**: Vite (vía Astro)

### Estilo de Código

- Usa características de ES6+
- Sigue las convenciones de código existentes
- Usa nombres de variables y funciones significativos
- Añade comentarios para lógica compleja
- Usa tipos de TypeScript donde sea aplicable

### Testing

Ejecuta la suite de tests:
```bash
npm test
```

Añade tests para nuevas funcionalidades en el directorio `tests/`.

### Configuración de Firebase

1. Crea un proyecto de Firebase
2. Habilita Autenticación (proveedor Microsoft)
3. Configura Realtime Database
4. Configura las reglas de Storage
5. Añade tu configuración a los archivos de entorno

### Configuración de Entorno

El proyecto soporta múltiples entornos:
- `dev` - Desarrollo
- `pre` - Pre-producción
- `pro` - Producción

Cada entorno tiene su propio archivo `.env` y scripts de npm.

## Guías de Codificación

### JavaScript/TypeScript

- Usa sintaxis moderna ES6+
- Prefiere `const` y `let` sobre `var`
- Usa arrow functions donde sea apropiado
- Usa template literals para interpolación de strings
- Usa destructuring para asignación de objetos/arrays
- Usa async/await para operaciones asíncronas

### Web Components

- Extiende `LitElement` para todos los web components
- Usa `static properties` para propiedades de componentes
- Implementa los métodos de ciclo de vida apropiados
- Usa CSS-in-JS para estilos
- Sigue la convención de nombres: `kebab-case` para nombres de elementos

### Integración con Firebase

- Usa el servicio centralizado de Firebase
- Maneja errores de forma elegante
- Implementa validación de datos apropiada
- Usa reglas de seguridad apropiadamente
- Minimiza lecturas/escrituras a la base de datos

### CSS/Estilos

- Usa propiedades CSS personalizadas para tematización
- Sigue diseño responsive mobile-first
- Usa nombres de clases semánticos
- Evita estilos inline
- Usa el sistema de temas centralizado

## Flujo de Trabajo para Desarrollo de Funcionalidades

1. **Planificación**: Discute nuevas funcionalidades en issues primero
2. **Diseño**: Crea mockups/wireframes si es necesario
3. **Implementación**:
   - Crea rama de funcionalidad desde `main`
   - Implementa con tests
   - Actualiza documentación
4. **Revisión**: Envía pull request para revisión de código
5. **Testing**: Asegúrate de que todos los tests pasen
6. **Despliegue**: Merge a main después de aprobación

## Consideraciones de Seguridad

- Nunca hagas commit de datos sensibles (claves API, contraseñas)
- Usa variables de entorno para configuración
- Implementa reglas de seguridad de Firebase apropiadas
- Valida input del usuario tanto en cliente como en servidor
- Sigue las guías de seguridad OWASP

## Guías de Rendimiento

- Optimiza consultas de Firebase
- Usa indexación apropiada para operaciones de base de datos
- Implementa lazy loading donde sea apropiado
- Minimiza el tamaño del bundle
- Usa estrategias de caché
- Monitoriza Core Web Vitals

## Accesibilidad

- Sigue las guías WCAG 2.1
- Usa HTML semántico
- Implementa etiquetas ARIA apropiadas
- Asegura navegación por teclado
- Testea con lectores de pantalla
- Mantén buen contraste de colores

## Documentación

- Actualiza README.md para cambios de configuración
- Documenta nuevas funcionalidades en CHANGELOG.md
- Añade comentarios de código inline
- Actualiza documentación de API
- Crea guías de usuario para nuevas funcionalidades

## ¿Preguntas?

¡No dudes en hacer preguntas en issues o discusiones. Estamos aquí para ayudar!

## Licencia

Al contribuir, aceptas que tus contribuciones serán licenciadas bajo la Licencia MIT.

---

# Contributing to Planning GameXP (English Version)

We love your input! We want to make contributing to Planning GameXP as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/AgilePlanning-io/planning-game-xp/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/AgilePlanning-io/planning-game-xp/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

People *love* thorough bug reports. I'm not even kidding.

## Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Firebase account and project
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AgilePlanning-io/planning-game-xp.git
cd PlanningGameXP
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.dev
# Edit .env.dev with your Firebase configuration
```

4. Start the development server:
```bash
npm run dev
```

### Project Structure

```
├── public/               # Static assets and client-side JavaScript
│   ├── js/              # JavaScript modules and components
│   │   ├── wc/          # Web Components (LitElement)
│   │   ├── services/    # Service layer
│   │   ├── utils/       # Utility functions
│   │   └── controllers/ # Application controllers
│   └── images/          # Static images
├── src/                 # Astro source files
│   ├── pages/           # Astro pages
│   ├── layouts/         # Page layouts
│   └── lib/             # Shared libraries
├── functions/           # Firebase Cloud Functions
└── tests/               # Test files
```

### Technology Stack

- **Frontend Framework**: Astro 5.x
- **Web Components**: LitElement
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Microsoft Provider)
- **Storage**: Firebase Storage
- **Testing**: Vitest + jsdom
- **Build Tool**: Vite (via Astro)

### Code Style

- Use ES6+ features
- Follow existing code conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Use TypeScript types where applicable

### Testing

Run the test suite:
```bash
npm test
```

Add tests for new features in the `tests/` directory.

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Microsoft provider)
3. Set up Realtime Database
4. Configure Storage rules
5. Add your configuration to environment files

### Environment Configuration

The project supports multiple environments:
- `dev` - Development
- `pre` - Pre-production
- `pro` - Production

Each environment has its own `.env` file and npm scripts.

## Coding Guidelines

### JavaScript/TypeScript

- Use modern ES6+ syntax
- Prefer `const` and `let` over `var`
- Use arrow functions where appropriate
- Use template literals for string interpolation
- Use destructuring for object/array assignment
- Use async/await for asynchronous operations

### Web Components

- Extend `LitElement` for all web components
- Use `static properties` for component properties
- Implement proper lifecycle methods
- Use CSS-in-JS for styling
- Follow naming convention: `kebab-case` for element names

### Firebase Integration

- Use the centralized Firebase service
- Handle errors gracefully
- Implement proper data validation
- Use security rules appropriately
- Minimize database reads/writes

### CSS/Styling

- Use CSS custom properties for theming
- Follow mobile-first responsive design
- Use semantic class names
- Avoid inline styles
- Use the centralized theme system

## Feature Development Workflow

1. **Planning**: Discuss new features in issues first
2. **Design**: Create mockups/wireframes if needed
3. **Implementation**:
   - Create feature branch from `main`
   - Implement with tests
   - Update documentation
4. **Review**: Submit pull request for code review
5. **Testing**: Ensure all tests pass
6. **Deployment**: Merge to main after approval

## Security Considerations

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Implement proper Firebase security rules
- Validate user input on both client and server
- Follow OWASP security guidelines

## Performance Guidelines

- Optimize Firebase queries
- Use proper indexing for database operations
- Implement lazy loading where appropriate
- Minimize bundle size
- Use caching strategies
- Monitor Core Web Vitals

## Accessibility

- Follow WCAG 2.1 guidelines
- Use semantic HTML
- Implement proper ARIA labels
- Ensure keyboard navigation
- Test with screen readers
- Maintain good color contrast

## Documentation

- Update README.md for setup changes
- Document new features in CHANGELOG.md
- Add inline code comments
- Update API documentation
- Create user guides for new features

## Questions?

Don't hesitate to ask questions in issues or discussions. We're here to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
