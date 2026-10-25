export function SkeletonMovieDetail() {
  return (
    <div className="app-main" style={{ padding: '20px' }}>
      <div className="detail-page">
        <div className="movie-backdrop" style={{ minHeight: '400px' }}>
          <div className="movie-backdrop__scrim" />
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ width: '260px', height: '390px', background: 'rgba(255,255,255,0.08)', borderRadius: '16px' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ height: '24px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
            <div style={{ height: '16px', width: '60%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
            <div style={{ height: '120px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
