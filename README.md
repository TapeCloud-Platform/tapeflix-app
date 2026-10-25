# TapeFlix VideoAPI

Frontend basado en el repositorio original [TapeCloud-Platform/tapeflix-app](https://github.com/TapeCloud-Platform/tapeflix-app), adaptado para usar:

- **TMDB** (The Movie Database) como fuente de películas, series, posters, sinopsis y créditos.
- **VideoAPI** (`videoapi.la`) como reproductor de video embebido, respetando su [API pública](https://videoapi.la/api).

## Estructura

```
tapeflix-videoapi/
├── index.html
├── vite.config.js
├── package.json
├── .env.example
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── api.js                 # Llamadas a TMDB + helpers de videoapi.la
│   ├── discoverApi.js         # Descubrimiento y búsqueda
│   ├── styles.css             # Estilos (basado en tapeflix-app)
│   ├── utils/
│   │   ├── format.js
│   │   └── theme.js
│   └── components/
│       ├── AppHeader.jsx
│       ├── AppSwitcher.jsx
│       ├── CatalogPage.jsx
│       ├── MovieCard.jsx
│       ├── MovieDetailPage.jsx
│       ├── Skeleton.jsx
│       ├── StarRating.jsx
│       └── icons.jsx
```

## Requisitos

- Node.js 18+
- npm 9+

## Instalación y ejecución

```bash
cd tapeflix-videoapi

# Copiar variables de entorno
cp .env.example .env

# Editar .env y agregar tu API key de TMDB:
# VITE_TMDB_API_KEY=tu_clave_aqui

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev
# Acceso: http://localhost:5174

# Build para producción
npm run build
```

## API Key de TMDB

Obtén una clave gratuita en: https://www.themoviedb.org/settings/api

## Reglas de VideoAPI cumplidas

- Películas: `/e/movie/{tmdb}?skin=prime&quality_selector=1&subtitles=1`
- Series: `/e/tv/{tmdb}/{temporada}/{episodio}?skin=prime&quality_selector=1&subtitles=1`
- `referrerpolicy="origin"` en todos los iframes
- No se usan parámetros bloqueados (`ads`, `post_message`, `communication`, `origin`)

## Visual

Se conserva el estilo de tapeflix-app:
- Fondo oscuro `#030407`
- Fuente Manrope
- Cards con poster 2:3 y chip de género
- Overlay de preview al pasar el mouse
- Detalle con backdrop borroso y píldoras de rating
