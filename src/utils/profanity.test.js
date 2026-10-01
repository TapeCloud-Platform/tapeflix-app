import { describe, expect, it } from 'vitest';
import { containsProfanity, isUsernameBlocked, normalizeText } from './profanity.js';

describe('profanity', () => {
  it('normaliza tildes y leet', () => {
    expect(normalizeText('PÚT4')).toContain('puta');
  });

  it('texto limpio no bloquea', () => {
    expect(containsProfanity('Una película excelente')).toBe(false);
  });

  it('no falsos positivos tipo Scunthorpe', () => {
    // "computadora" contiene "puta" como subcadena pero no como palabra
    expect(isUsernameBlocked('computadora')).toBe(false);
    expect(isUsernameBlocked('computadora99')).toBe(false);
  });
});
