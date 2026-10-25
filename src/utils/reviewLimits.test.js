import { describe, expect, it } from 'vitest';
import { editCooldownRemaining, parseCooldownFromMessage, REVIEW_EDIT_COOLDOWN_SECONDS, COMMENT_COOLDOWN_SECONDS } from './reviewLimits.js';

describe('reviewLimits', () => {
  it('permite primera edición (null)', () => {
    expect(editCooldownRemaining(null)).toBe(0);
    expect(editCooldownRemaining(undefined)).toBe(0);
  });

  it('fecha inválida permite editar', () => {
    expect(editCooldownRemaining('no-fecha')).toBe(0);
  });

  it('recién editado espera cooldown completo', () => {
    const now = Date.now();
    expect(editCooldownRemaining(new Date(now - 1000).toISOString(), now))
      .toBe(REVIEW_EDIT_COOLDOWN_SECONDS - 1);
  });

  it('reloj desfasado nunca supera el cooldown', () => {
    const future = new Date(Date.now() + 3600_000).toISOString();
    expect(editCooldownRemaining(future)).toBe(REVIEW_EDIT_COOLDOWN_SECONDS);
  });

  it('pasado el cooldown permite editar', () => {
    const old = new Date(Date.now() - (REVIEW_EDIT_COOLDOWN_SECONDS + 5) * 1000).toISOString();
    expect(editCooldownRemaining(old)).toBe(0);
  });

  it('parsea segundos de mensaje 429', () => {
    expect(parseCooldownFromMessage('Podés volver a editar en 12 segundos')).toBe(12);
    expect(parseCooldownFromMessage('Podés volver a comentar en 30 segundos')).toBe(30);
    expect(parseCooldownFromMessage('sin número')).toBeNull();
  });

  it('cooldown de comentarios es 30 segundos', () => {
    expect(COMMENT_COOLDOWN_SECONDS).toBe(30);
  });
});
