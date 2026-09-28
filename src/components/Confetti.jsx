import { useEffect, useRef } from 'react';

const DEFAULT_COLORS = ['#d3203e', '#3b82f6', '#22c55e', '#fbbf24', '#a855f7', '#ffffff'];
const PIECES = 140;

/** Lluvia de confeti en canvas a pantalla completa, sin dependencias. */
export default function Confetti({ duration = 2600, colors = DEFAULT_COLORS }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: PIECES }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      rot: Math.random() * Math.PI * 2,
      vr: -0.1 + Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      circle: Math.random() < 0.3,
    }));

    let frame = 0;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = elapsed > duration - 600 ? Math.max(0, 1 - (elapsed - (duration - 600)) / 600) : 1;
      for (const p of pieces) {
        p.x += p.vx + Math.sin((elapsed / 300) + p.rot);
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.circle) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      if (elapsed < duration) {
        frame = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [colors, duration]);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}
