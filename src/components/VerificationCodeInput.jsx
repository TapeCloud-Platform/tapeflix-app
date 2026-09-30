import { useRef } from 'react';

const CODE_LENGTH = 6;

/**
 * Código de 6 dígitos en celdas separadas que actúa como un solo campo:
 * auto-avanza al escribir, retrocede con Backspace, acepta pegado,
 * autocompletado por SMS y navegación con flechas.
 */
export default function VerificationCodeInput({ value, onChange, disabled }) {
  const inputsRef = useRef([]);
  const digits = (value || '').slice(0, CODE_LENGTH).padEnd(CODE_LENGTH, ' ').split('');

  function focusCell(index) {
    inputsRef.current[index]?.focus();
    inputsRef.current[index]?.select();
  }

  function emit(next) {
    onChange(next.join('').replace(/ /g, ''));
  }

  function handleChange(event, index) {
    const cleaned = event.target.value.replace(/\D/g, '');
    if (!cleaned) {
      const next = digits.slice();
      next[index] = ' ';
      emit(next);
      return;
    }
    // Pegado o autocompletado: reparte los dígitos desde la celda actual.
    const next = digits.slice();
    const chars = cleaned.slice(0, CODE_LENGTH - index).split('');
    chars.forEach((ch, offset) => {
      next[index + offset] = ch;
    });
    emit(next);
    focusCell(Math.min(index + chars.length, CODE_LENGTH - 1));
  }

  function handleKeyDown(event, index) {
    if (event.key === 'Backspace' && digits[index] === ' ' && index > 0) {
      event.preventDefault();
      const next = digits.slice();
      next[index - 1] = ' ';
      emit(next);
      focusCell(index - 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusCell(index - 1);
    } else if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      event.preventDefault();
      focusCell(index + 1);
    }
  }

  function handleFocus(event) {
    event.target.select();
  }

  return (
    <div className="otp-input" role="group" aria-label="Código de verificación de 6 dígitos">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          className="otp-input__cell"
          value={digit === ' ' ? '' : digit}
          onChange={(event) => handleChange(event, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onFocus={handleFocus}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={CODE_LENGTH}
          disabled={disabled}
          aria-label={`Dígito ${index + 1}`}
        />
      ))}
    </div>
  );
}
