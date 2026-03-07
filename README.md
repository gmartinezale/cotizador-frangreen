# QUOTER ONLINE

Este es un proyecto de Next.js 16 con Tailwind CSS, ESLint, TypeScript y Mongoose para las APIs.
Agrega tus productos con categorías y exporta tus cotizaciones.

## Requisitos Previos

- [NodeJS >= 20.x](https://nodejs.org/) (Next.js 16 requiere Node 20+)
- [pnpm >= 9.0.0](https://pnpm.io/installation) (gestor de paquetes recomendado)
- [MongoDB](https://www.mongodb.com/try/download/community) server

## Instalación

### 1. Instalar pnpm (si no lo tienes)

```bash
# macOS/Linux
curl -fsSL https://get.pnpm.io/install.sh | sh -

# O usando npm
npm install -g pnpm@9
```

### 2. Configurar el proyecto

1. Clona el repositorio.
2. Ejecuta `pnpm install` para instalar las dependencias.
3. Copia `.env.example` a `.env` y complétalo con tus valores.
4. Configura la conexión en el proceso de seed en `scripts/seed.js`.
5. Ejecuta el proceso de seed con `pnpm seed`.
6. Ejecuta `pnpm dev` para iniciar el servidor de desarrollo.

## Scripts Disponibles

```bash
pnpm dev         # Inicia el servidor de desarrollo
pnpm build       # Construye la aplicación para producción
pnpm start       # Inicia el servidor de producción
pnpm lint        # Ejecuta el linter
pnpm prettier    # Formatea el código
pnpm seed        # Ejecuta el script de seed de datos
```

## Uso

Visita `http://localhost:3000` en tu navegador para ver la aplicación.

## Tecnologías Principales

- **Next.js 16** - Framework de React con React Compiler habilitado
- **React 19** - Biblioteca de UI
- **TypeScript 5** - Superset tipado de JavaScript
- **Tailwind CSS 3** - Framework CSS utility-first
- **Mongoose 8** - ODM de MongoDB
- **NextAuth.js 5** - Autenticación
- **pnpm 9** - Gestor de paquetes rápido y eficiente

## Iconos
Este proyecto usa [Heroicons](https://heroicons.com/)

## Características de Next.js 16

Este proyecto utiliza las siguientes características de Next.js 16:
- **React Compiler**: Optimizaciones automáticas de rendimiento
- **Turbopack**: Build tool ultra-rápido para desarrollo

## Contribuir

Los pull requests son bienvenidos. Para cambios importantes, por favor abre un issue primero para discutir lo que te gustaría cambiar.

## Licencia

[MIT](https://choosealicense.com/licenses/mit/)