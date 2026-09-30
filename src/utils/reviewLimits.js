/** Límites de reseñas compartidos con el backend (ver application.properties). */
export const REVIEW_TITLE_MAX = 150;
export const REVIEW_BODY_MAX = 750;
export const REVIEW_EDIT_COOLDOWN_SECONDS = 30;

/** Segundos restantes para volver a editar según updatedAt (0 = ya se puede). */
export function editCooldownRemaining(updatedAt, now = Date.now()) {
  if (!updatedAt) {
    return 0;
  }
  const ref = new Date(updatedAt).getTime();
  if (Number.isNaN(ref)) {
    return 0;
  }
  const elapsed = Math.floor((now - ref) / 1000);
  return Math.max(0, REVIEW_EDIT_COOLDOWN_SECONDS - elapsed);
}

/** Extrae los segundos de espera de un mensaje 429 ("...en N segundos"). */
export function parseCooldownFromMessage(message) {
  const match = /(\d+)\s*segundos?/.exec(String(message || ''));
  return match ? Number(match[1]) : null;
}
