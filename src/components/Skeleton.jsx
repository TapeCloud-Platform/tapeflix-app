export function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function SkeletonCatalogGrid({ count = 8 }) {
  return (
    <div className="skeleton-grid">
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
