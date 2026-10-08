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

  it('español común no bloquea aunque choque con otro idioma', () => {
    // "con" es insulto en francés pero preposición en español; "año" normaliza a "ano"
    expect(containsProfanity('La mejor película del año, con una fotografía increíble')).toBe(false);
    expect(containsProfanity('Canta con una pasión única')).toBe(false);
    expect(isUsernameBlocked('con')).toBe(false);
  });

  it('insultos reales siguen bloqueando', () => {
    expect(containsProfanity('esta puta madre')).toBe(true);
    expect(isUsernameBlocked('puta.madre')).toBe(true);
  });
});
