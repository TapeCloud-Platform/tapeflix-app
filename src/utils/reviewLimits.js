/** Límites de reseñas compartidos con el backend (ver application.properties). */
export const REVIEW_TITLE_MAX = 150;
export const REVIEW_BODY_MAX = 750;
export const REVIEW_EDIT_COOLDOWN_SECONDS = 30;

/**
 * Segundos restantes para volver a editar según lastEditedAt (0 = ya se puede).
 * - null/ausente (nunca editada) → 0, la primera edición siempre está permitida.
 * - Fecha futura (reloj desfasado) → se trata como recién editada: como máximo
 *   el cooldown completo, nunca un conteo absurdo.
 */
export function editCooldownRemaining(lastEditedAt, now = Date.now()) {
  if (!lastEditedAt) {
    return 0;
  }
  const ref = new Date(lastEditedAt).getTime();
  if (Number.isNaN(ref)) {
    return 0;
  }
  const elapsed = Math.max(0, Math.floor((now - ref) / 1000));
  return Math.max(0, Math.min(REVIEW_EDIT_COOLDOWN_SECONDS, REVIEW_EDIT_COOLDOWN_SECONDS - elapsed));
}

/** Extrae los segundos de espera de un mensaje 429 ("...en N segundos"). */
export function parseCooldownFromMessage(message) {
  const match = /(\d+)\s*segundos?/.exec(String(message || ''));
  return match ? Number(match[1]) : null;
}
