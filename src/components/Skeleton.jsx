export function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonCatalogGrid({ count = 8 }) {
  return (
    <div className="skeleton-grid" role="status" aria-label="Cargando contenido">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-grid__item">
          <SkeletonBlock className="skeleton--poster" />
          <SkeletonBlock className="skeleton--line" style={{ width: '85%' }} />
          <SkeletonBlock className="skeleton--line" style={{ width: '55%' }} />
        </div>
      ))}
    </div>
  );
}

/** Inicio del catálogo: slider hero + filmstrip + filas por género. */
export function SkeletonCatalogHome() {
  return (
    <div role="status" aria-label="Cargando contenido">
      <div className="top-slider" aria-hidden="true">
        <div className="top-slider__head">
          <SkeletonBlock className="skeleton--line" style={{ width: 200, height: 18 }} />
        </div>
        <div className="top-slider__track">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="top-slider__item">
              <SkeletonBlock className="skeleton--poster" />
              <SkeletonBlock className="skeleton--line" style={{ width: '85%' }} />
              <SkeletonBlock className="skeleton--line" style={{ width: '55%' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="filmstrip-block" aria-hidden="true">
        <SkeletonBlock className="skeleton--line" style={{ width: 160, height: 16, marginBottom: 8 }} />
        <SkeletonBlock className="skeleton--line" style={{ width: 260, marginBottom: 12 }} />
        <div className="stack-shelf">
          <div className="stack-shelf__track">
            {Array.from({ length: 8 }).map((_, index) => (
              <SkeletonBlock key={index} className="skeleton--shelf-item" />
            ))}
          </div>
        </div>
      </div>

      {['Género', 'Género'].map((label, row) => (
        <div key={row} className="genre-row" aria-hidden="true">
          <SkeletonBlock className="skeleton--line" style={{ width: 140, height: 16, marginBottom: 12 }} />
          <div className="genre-row__track">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="genre-row__item">
                <SkeletonBlock className="skeleton--poster" />
                <SkeletonBlock className="skeleton--line" style={{ width: '80%' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonReviewCards({ count = 2 }) {
  return (
    <div className="modal-reviews-list" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="review-card">
          <div className="review-header">
            <SkeletonBlock className="skeleton--line" style={{ width: '45%' }} />
            <SkeletonBlock className="skeleton--line" style={{ width: 90 }} />
          </div>
          <SkeletonBlock className="skeleton--line" style={{ width: '95%' }} />
          <SkeletonBlock className="skeleton--line" style={{ width: '80%' }} />
          <div className="review-interaction-bar">
            <SkeletonBlock className="skeleton--pill" style={{ width: 70, height: 30 }} />
            <SkeletonBlock className="skeleton--pill" style={{ width: 130, height: 30 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonReviewForm() {
  return (
    <div className="review-form-card" aria-hidden="true">
      <SkeletonBlock className="skeleton--line" style={{ width: '55%', marginBottom: 14 }} />
      <SkeletonBlock className="skeleton--btn" style={{ width: '100%' }} />
    </div>
  );
}

/** Ficha de película: topbar + backdrop con póster + sección de reseñas. */
export function SkeletonMovieDetail() {
  return (
    <div role="status" aria-label="Cargando película">
      <header className="topbar detail-topbar" aria-hidden="true">
        <SkeletonBlock className="skeleton--btn" style={{ width: 130, height: 38 }} />
        <SkeletonBlock className="skeleton--title" style={{ width: '40%' }} />
      </header>

      <section className="detail-page" aria-hidden="true">
        <div className="movie-backdrop">
          <div className="detail-hero movie-backdrop__content">
            <SkeletonBlock className="skeleton--movie-poster" />
            <div className="detail-info">
              <div className="movie-genre-chips">
                {[110, 90, 120].map((width, index) => (
                  <SkeletonBlock key={index} className="skeleton--pill" style={{ width, height: 28 }} />
                ))}
              </div>
              <div className="detail-stats">
                <SkeletonBlock className="skeleton--pill" style={{ width: 220, height: 32 }} />
                <SkeletonBlock className="skeleton--pill" style={{ width: 130, height: 32 }} />
              </div>
              <div className="detail-biography">
                <SkeletonBlock className="skeleton--line" style={{ width: '100%' }} />
                <SkeletonBlock className="skeleton--line" style={{ width: '95%' }} />
                <SkeletonBlock className="skeleton--line" style={{ width: '70%' }} />
              </div>
            </div>
          </div>
        </div>

        <section className="section-block" aria-hidden="true">
          <SkeletonBlock className="skeleton--line" style={{ width: 180, marginBottom: 14 }} />
          <div className="information-panel">
            <div className="rating-distribution rating-distribution--wide">
              <SkeletonBlock className="skeleton--line" style={{ width: '35%', marginBottom: 8 }} />
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="rating-distribution__bar-row">
                  <SkeletonBlock className="skeleton--line" style={{ width: 20 }} />
                  <SkeletonBlock className="skeleton--bar" />
                  <SkeletonBlock className="skeleton--line" style={{ width: 24 }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="detail-reviews-section">
          <SkeletonBlock className="skeleton--line" style={{ width: 220, height: 20, marginBottom: 16 }} />
          <div className="review-panel">
            <div className="review-panel__list">
              <SkeletonReviewCards count={2} />
            </div>
            <aside className="review-panel__form">
              <SkeletonReviewForm />
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function SkeletonHeroStats() {
  return (
    <div className="entity-hero__stats" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="entity-hero__stat">
          <SkeletonBlock className="skeleton--stat" />
          <SkeletonBlock className="skeleton--line" style={{ width: 64 }} />
        </div>
      ))}
    </div>
  );
}

function SkeletonTabs({ count = 3 }) {
  return (
    <div className="entity-tabs" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} className="skeleton--tab" />
      ))}
    </div>
  );
}

function SkeletonSidebarActions() {
  return (
    <div className="entity-sidebar__actions" aria-hidden="true">
      <SkeletonBlock className="skeleton--action-row" />
      <div className="entity-sidebar__share">
        <SkeletonBlock className="skeleton--action-row" />
        <SkeletonBlock className="skeleton--action-row" />
      </div>
    </div>
  );
}

function SkeletonRatingBars({ count = 5 }) {
  return (
    <div className="rating-distribution" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rating-distribution__bar-row">
          <SkeletonBlock className="skeleton--line" style={{ width: 20 }} />
          <SkeletonBlock className="skeleton--bar" />
          <SkeletonBlock className="skeleton--line" style={{ width: 24 }} />
        </div>
      ))}
    </div>
  );
}

/** Ficha de persona: hero + tabs + créditos y sidebar. */
export function SkeletonPersonDetail() {
  return (
    <div role="status" aria-label="Cargando persona">
      <header className="detail-topbar" aria-hidden="true">
        <SkeletonBlock className="skeleton--btn" style={{ width: 110, height: 38 }} />
      </header>

      <section className="entity-hero" aria-hidden="true">
        <div className="entity-hero__left">
          <SkeletonBlock className="skeleton--avatar" />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className="skeleton--title" style={{ width: 220, marginBottom: 8 }} />
            <SkeletonBlock className="skeleton--line" style={{ width: 140 }} />
          </div>
        </div>
        <div className="entity-hero__right">
          <SkeletonHeroStats />
          <SkeletonBlock className="skeleton--btn" style={{ width: 230 }} />
        </div>
      </section>

      <SkeletonTabs count={3} />

      <div className="entity-layout" aria-hidden="true">
        <div className="entity-main">
          <section className="section-block">
            <SkeletonBlock className="skeleton--line" style={{ width: 190, marginBottom: 14 }} />
            <div className="cards-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index}>
                  <SkeletonBlock className="skeleton--poster" />
                  <SkeletonBlock className="skeleton--line" style={{ width: '85%' }} />
                  <SkeletonBlock className="skeleton--line" style={{ width: '55%' }} />
                </div>
              ))}
            </div>
          </section>

          <section className="section-block">
            <SkeletonBlock className="skeleton--line" style={{ width: 180, marginBottom: 14 }} />
            <SkeletonReviewCards count={2} />
          </section>
        </div>

        <aside className="entity-sidebar">
          <div className="entity-sidebar__actions" aria-hidden="true">
            <SkeletonBlock className="skeleton--action-row" />
            <div className="entity-sidebar__share">
              <SkeletonBlock className="skeleton--action-row" />
              <SkeletonBlock className="skeleton--action-row" />
            </div>
          </div>
          <div className="entity-sidebar__panel" aria-hidden="true">
            <SkeletonBlock className="skeleton--line" style={{ width: 160, marginBottom: 12 }} />
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton-row">
                <SkeletonBlock className="skeleton--circle" style={{ width: 36, height: 36 }} />
                <SkeletonBlock className="skeleton--line" style={{ width: '55%' }} />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Perfil público: hero estilo persona + tabs, actividad y sidebar. */
export function SkeletonUserProfile() {
  return (
    <div role="status" aria-label="Cargando perfil">
      <section className="entity-hero" aria-hidden="true">
        <div className="entity-hero__left">
          <SkeletonBlock className="skeleton--avatar" />
          <div style={{ flex: 1 }}>
            <SkeletonBlock className="skeleton--line" style={{ width: 130, marginBottom: 8 }} />
            <SkeletonBlock className="skeleton--title" style={{ width: 220, marginBottom: 8 }} />
            <SkeletonBlock className="skeleton--line" style={{ width: 120 }} />
          </div>
        </div>
        <div className="entity-hero__right">
          <SkeletonHeroStats />
        </div>
      </section>

      <SkeletonTabs count={1} />

      <div className="entity-layout" aria-hidden="true">
        <div className="entity-main">
          <section className="section-block">
            <SkeletonBlock className="skeleton--line" style={{ width: 120, marginBottom: 14 }} />
            <div className="information-panel">
              <div className="information-grid">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="information-cell">
                    <SkeletonBlock className="skeleton--line" style={{ width: '45%', marginBottom: 6 }} />
                    <SkeletonBlock className="skeleton--line" style={{ width: '60%' }} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="entity-sidebar">
          <SkeletonSidebarActions />
          <div className="entity-sidebar__panel">
            <SkeletonBlock className="skeleton--line" style={{ width: 140, marginBottom: 12 }} />
            <SkeletonRatingBars count={2} />
          </div>
        </aside>
      </div>
    </div>
  );
}
