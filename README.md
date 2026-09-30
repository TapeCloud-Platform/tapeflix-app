# TapeFlix - Catálogo de Películas 🎬

Aplicación cliente para exploración de películas, series, reviews y comentarios. Desarrollado con **React 18** y **Vite**.

## 📋 Responsabilidades

- ✅ Grid de películas organizadas por género
- ✅ Top 15 películas por rating en categoría "Todas"
- ✅ Modal de detalles de película
- ✅ Reviews, likes y comentarios
- ✅ Infinite scroll + "Cargar más" para exploración
- ✅ Filtrado dinámico por género
- ✅ Integración con sesión SSO del Portal

---

## 🏗️ Estructura

```
src/
├── components/
│   ├── App.jsx                 # Shell principal con grid
│   ├── MovieModal.jsx          # Modal de detalles película
│   ├── CategoryModal.jsx       # Modal infinite scroll
│   └── [otros componentes]
│
├── api.js                      # Cliente HTTP (axios)
├── main.jsx                    # Punto de entrada React
└── styles.css                  # Estilos globales
```

---

## 🚀 Cómo Ejecutar

### Docker (Recomendado)

```bash
cd TapeCloud
docker compose up --build tapeflix-app
# Puerto 5174
# Acceso: http://localhost:5174
```

### Local (Sin Docker)

**Requisitos:**
- Node.js 18+
- npm 9+
- Backend ejecutándose en http://localhost:8080

```bash
cd tapeflix-app

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev
# Puerto 5174

# Build para producción
npm run build
# Genera: dist/
```

---

## 🎬 Flujo de Datos

### Carga inicial

```
App.jsx monta
        ↓
useEffect: getMovies()
        ↓
GET /api/content/movies?page=0&size=UNLIMITED
        ↓
Backend devuelve ~243 películas
        ↓
setMovies([...])
        ↓
Renderiza Grid
```

### Filtrado por categoría

```
Usuario selecciona categoría (género)
        ↓
setSelectedCategory(genre)
        ↓
Re-calcula filteredMovies:

  Si selectedCategory === 'Todas':
    → sort by vote_average DESC
    → slice(0, 15)
    
  Si otro género:
    → filter por genre
        ↓
Re-renderiza grid
```

### Detalles de película

```
Usuario clickea película
        ↓
MovieModal abre
        ↓
Muestra:
  - Título, descripción
  - Rating, votos
  - Reviews
  - Likes
  - Comentarios
        ↓
POST /api/reviews (agregar review)
POST /api/likes (marcar como favorito)
```

### Explorar más películas

```
Usuario clickea "Ver más" en categoría
        ↓
CategoryModal abre
        ↓
Infinite scroll:
  - Muestra 40 películas (2 páginas)
  - Al scroll a final: carga 40 más
  - Botón "Cargar más": carga 40 páginas simultáneamente
        ↓
Filtrado: Solo películas del género seleccionado
```

---

## 🎨 Componentes principales

### App.jsx
Shell principal con grid de películas.

**Estado:**
```javascript
const [movies, setMovies] = useState([]);
const [selectedCategory, setSelectedCategory] = useState('Todas');
const [sessionUser, setSessionUser] = useState(null);
```

**Filtrado:**
```javascript
const filteredMovies = selectedCategory === 'Todas'
  ? movies
      .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
      .slice(0, 15)
  : movies.filter((m) => m.genre?.includes(selectedCategory));
```

**Features:**
- Barra de categorías dinámicas (extraídas de películas)
- Grid responsive
- Contador de películas: "{filteredMovies.length} títulos"
- Botón "Ver más" → CategoryModal
- Sesión SSO integrada

---

### MovieModal.jsx
Modal de detalles y reviews de película.

**Muestra:**
```javascript
{
  id, title, genre,
  voteAverage, voteCount,
  overview,
  releaseDate,
  posterPath, backdropPath
}
```

**Funcionalidades:**
- ❤️ Like/Unlike
- 💬 Agregar review
- ⭐ Rating
- 📝 Ver comentarios
- 🔗 Compartir

---

### CategoryModal.jsx
Modal con infinite scroll y "Cargar más".

**Estado:**
```javascript
const [allMovies, setAllMovies] = useState([]);
const [currentPage, setCurrentPage] = useState(0);
const [nextPage, setNextPage] = useState(1);
const [isLoading, setIsLoading] = useState(false);
```

**Funcionalidades:**
- 📜 Infinite scroll (detecta al llegar al final)
- 🔄 "Cargar más" button (carga 2 páginas = 40 películas)
- 🎬 Filtrado por género
- 📊 Paginación: 20 películas/página

**Lógica:**
```javascript
// Infinite scroll: 100px antes del final
scrollPosition + 100 >= scrollHeight
  → loadMoreMovies()

// Cargar más: carga 2 páginas simultáneamente
Promise.all([
  getMoviesPaginated(genre, page, 20),
  getMoviesPaginated(genre, page + 1, 20)
])
  → Acumula en allMovies
```

---

## 🔐 Autenticación (SSO)

### Query Params en URL

```
http://localhost:5174/?sso_token=TOKEN&sso_email=EMAIL&sso_display_name=NAME
```

### Flujo

```
TapeFlix carga
        ↓
Lee query params
        ↓
Extrae: sso_token, sso_email, sso_display_name
        ↓
Guarda en localStorage
        ↓
Recupera en App.jsx
        ↓
Muestra sesión: "Sesión: {displayName}"
```

### Logout

```
Usuario clickea "Salir"
        ↓
handleLogout()
        ↓
localStorage.removeItem(token, email, displayName)
        ↓
Redirige a Portal: http://localhost:5173
```

---

## 🔌 APIs Utilizadas

### GET `/api/content/movies`
Obtiene todas las películas paginadas.

```javascript
const response = await axios.get(
  'http://localhost:8080/api/content/movies?page=0&size=1000'
);

// Response:
{
  "content": [
    {
      "id": 1,
      "title": "Toy Story",
      "genre": "Animation, Comedy",
      "voteAverage": 8.3,
      "voteCount": 11000,
      "overview": "A cowboy doll...",
      "releaseDate": "1995-10-30",
      "posterPath": "/...",
      "backdropPath": "/..."
    }
  ],
  "totalElements": 243,
  "totalPages": 13
}
```

### GET `/api/content/movies/genre?genre=Animation`
Películas filtradas por género.

```javascript
const response = await axios.get(
  'http://localhost:8080/api/content/movies/genre?genre=Animation&page=0&size=20'
);
```

### POST `/api/reviews`
Agregar review a película (futuro).

```javascript
await axios.post('http://localhost:8080/api/reviews', {
  movieId: 1,
  userId: user.id,
  rating: 9,
  comment: "¡Excelente película!"
});
```

### POST `/api/likes`
Marcar película como favorita (futuro).

```javascript
await axios.post('http://localhost:8080/api/likes', {
  movieId: 1,
  userId: user.id
});
```

---

## ⚙️ Configuración

### vite.config.js

```javascript
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0'
  }
});
```

### .env

```
VITE_API_URL=http://localhost:8080
```

### api.js

```javascript
const API_URL = import.meta.env.VITE_API_URL;

export async function getMovies() {
  const response = await axios.get(`${API_URL}/api/content/movies?page=0&size=1000`);
  return response.data;
}

export async function getMoviesPaginated(genre, page, size) {
  const response = await axios.get(
    `${API_URL}/api/content/movies/genre?genre=${genre}&page=${page}&size=${size}`
  );
  return response.data;
}
```

---

## 🎨 Estilos

### Grid de películas

```css
.movies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  padding: 20px;
}

.movie-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.movie-card:hover {
  transform: scale(1.05);
}
```

### Modal

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
}
```

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Port 5174 already in use" | Cambiar puerto en vite.config.js |
| "Cannot connect to backend" | Verificar http://localhost:8080/health |
| "Películas no cargan" | Ver logs: `docker compose logs tapecloud-auth-core` |
| "Sesión no persiste" | Limpiar localStorage en DevTools |
| "Scroll infinito no funciona" | Verificar calculateScroll() en CategoryModal.jsx |

---

## 🚀 Features Futuros

- ⭐ Rating de usuario por película
- 💬 Sistema de comentarios avanzado
- 👥 Recomendaciones personalizadas
- 📊 Estadísticas de visualización
- 🎥 Streaming integration (si aplica)

---

## 📚 Dependencias principales

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "axios": "^1.4.0",
  "@vitejs/plugin-react": "^4.0.0"
}
```

---

## 📖 Más información

- [README raíz](../README.md) - Arquitectura general
- [Backend (auth-core)](../tapecloud-auth-core/README.md) - APIs
- [Portal](../tapecloud-portal/README.md) - Autenticación SSO

---

**Última actualización:** Septiembre 2024
