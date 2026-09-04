# tapeflix-app

Aplicación cliente de TapeFlix para películas y series, desarrollada con React y Vite.

## Responsabilidad

TapeFlix se ocupa de la experiencia visual y de interacción relacionada con contenido audiovisual:

- películas y series
- catálogo y detalles de contenido
- reseñas y comentarios
- navegación del usuario dentro de TapeFlix

El contenido, la identidad y los datos compartidos deben venir de `tapecloud-auth-core`. Esta aplicación no debe convertirse en una fuente de datos independiente.

## Estado actual

Contiene una aplicación React de base con cliente API, componentes principales y estilos. La conexión completa con los endpoints centrales se implementará progresivamente.

## Desarrollo

```powershell
npm install
npm run dev
npm run build
```

La rama de desarrollo es `develop`. `node_modules` y `dist` están excluidos mediante `.gitignore`.
