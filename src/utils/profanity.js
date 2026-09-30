/**
 * Pre-chequeo local de lenguaje no permitido (ES/EN/PT/FR).
 * Las palabras NO están hardcodeadas: viven en `src/data/profanity/*.txt`
 * y se importan como texto. El backend valida de forma autoritativa y puede
 * rechazar con 400 aunque este chequeo no detecte nada.
 */
import esRaw from '../data/profanity/es.txt?raw';
import enRaw from '../data/profanity/en.txt?raw';
import ptRaw from '../data/profanity/pt.txt?raw';
import frRaw from '../data/profanity/fr.txt?raw';

function stripDiacritics(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeText(text) {
  if (!text) {
    return '';
  }
  const lower = stripDiacritics(String(text).toLowerCase());
  const leet = lower.replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[!1]/g, 'i')
    .replace(/0/g, 'o').replace(/[$5]/g, 's').replace(/7/g, 't').replace(/\+/g, 't');
  return leet.replace(/(.)\1{2,}/g, '$1');
}

function loadWords() {
  const words = new Set();
  for (const raw of [esRaw, enRaw, ptRaw, frRaw]) {
    for (const line of String(raw).split('\n')) {
      const word = normalizeText(line.trim());
      if (word && !word.startsWith('#')) {
        words.add(word);
      }
    }
  }
  const extra = import.meta.env.VITE_PROFANITY_EXTRA_WORDS || '';
  for (const piece of extra.split(',')) {
    const word = normalizeText(piece.trim());
    if (word) {
      words.add(word);
    }
  }
  return [...words];
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

const PATTERNS = loadWords().map(
  (word) => new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(word)}(?![\\p{L}\\p{N}_])`, 'iu'),
);

/** Devuelve el fragmento bloqueado o null si el texto está limpio. */
export function findProfanity(text) {
  if (!text) {
    return null;
  }
  const normalized = normalizeText(text);
  for (const pattern of PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

export function containsProfanity(text) {
  return findProfanity(text) !== null;
}

/**
 * Nombres de usuario: un solo token. Se parte por separadores y se bloquea
 * si algún token coincide ("puta.madre" sí, "computadora" no).
 */
export function isUsernameBlocked(username) {
  if (!username) {
    return false;
  }
  const normalized = normalizeText(username);
  const tokens = new Set(normalized.split(/[^a-z0-9]+/).filter(Boolean));
  tokens.add(normalized.replace(/[^a-z0-9]/g, ''));
  // Sin dígitos en los bordes ("fucker99" -> "fucker"), sin reintroducir
  // falsos positivos ("computadora99" -> "computadora", que no coincide).
  for (const token of [...tokens]) {
    tokens.add(token.replace(/^[0-9]+|[0-9]+$/g, ''));
  }
  for (const pattern of PATTERNS) {
    for (const token of tokens) {
      if (!token) {
        continue;
      }
      pattern.lastIndex = 0;
      const anchored = new RegExp(`^(?:${pattern.source})$`, pattern.flags);
      if (anchored.test(token)) {
        return true;
      }
    }
  }
  return false;
}
