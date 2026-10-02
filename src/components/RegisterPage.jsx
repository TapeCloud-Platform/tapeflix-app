import { useState } from 'react';
import { Button, TextField, Input, Label } from '@heroui/react';
import { register, resendVerificationCode, verifyEmail } from '../api';
import LoadingIcon from './LoadingIcon';
import VerificationCodeInput from './VerificationCodeInput';
import Confetti from './Confetti';

export default function RegisterPage({ onSuccess, onGoToLogin }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [createdResponse, setCreatedResponse] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const response = await register(email, username, password);
      setPendingEmail(response.email);
      setInfo('Te enviamos un código de 6 dígitos a tu email. Vence en 5 minutos.');
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError('Ingresá el código de 6 dígitos.');
      return;
    }
    setLoading(true);
    try {
      const response = await verifyEmail(pendingEmail, code);
      setCreatedResponse(response);
    } catch (err) {
      setError(err.message || 'No se pudo verificar el código.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await resendVerificationCode(pendingEmail);
      setInfo('Te enviamos un nuevo código.');
    } catch (err) {
      setError(err.message || 'No se pudo reenviar el código.');
    } finally {
      setLoading(false);
    }
  }

  if (createdResponse) {
    return (
      <div className="celebration">
        <Confetti />
        <div className="success-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>
        <h1>¡Cuenta creada!</h1>
        <p className="auth-hint">
          Tu email quedó verificado. Ya podés entrar a TapeCloud, TapeFlix y TapeBeat con esta cuenta.
        </p>
        <Button type="button" variant="primary" className="auth-submit" onClick={() => onSuccess(createdResponse)}>
          Entrar
        </Button>
      </div>
    );
  }

  if (pendingEmail) {
    return (
      <>
        <h1>Verificá tu email</h1>
        <p className="auth-hint">Ingresá el código de 6 dígitos que enviamos a {pendingEmail}.</p>

        <form className="login-form" onSubmit={handleVerify}>
          <VerificationCodeInput value={code} onChange={setCode} disabled={loading} />

          {error && <p className="error">{error}</p>}
          {info && <p className="auth-hint">{info}</p>}

          <Button type="submit" variant="primary" className="auth-submit" isDisabled={loading}>
            {loading ? (
              <>
                <LoadingIcon size={16} /> Verificando...
              </>
            ) : (
              'Verificar'
            )}
          </Button>

          <Button type="button" variant="ghost" onClick={handleResend} isDisabled={loading}>
            Reenviar código
          </Button>
        </form>
      </>
    );
  }

  return (
    <>
      <h1>Crear cuenta</h1>
      <p className="auth-hint">Elegí un usuario: lo vas a usar para iniciar sesión y para que te vean en tus reseñas.</p>

      <form className="login-form" onSubmit={handleSubmit}>
        <TextField className="auth-field" value={email} onChange={setEmail} isRequired>
          <Label>Email</Label>
          <Input type="email" placeholder="vos@ejemplo.com" autoFocus />
        </TextField>

        <TextField className="auth-field" value={username} onChange={setUsername} isRequired>
          <Label>Nombre de usuario</Label>
          <Input placeholder="tu_usuario" maxLength={30} />
        </TextField>

        <TextField className="auth-field" value={password} onChange={setPassword} isRequired>
          <Label>Contraseña</Label>
          <Input type="password" placeholder="Mínimo 8 caracteres" minLength={8} />
        </TextField>

        <TextField className="auth-field" value={confirmPassword} onChange={setConfirmPassword} isRequired>
          <Label>Confirmar contraseña</Label>
          <Input type="password" placeholder="Repetí la contraseña" minLength={8} />
        </TextField>

        {error && <p className="error">{error}</p>}

        <Button type="submit" variant="primary" className="auth-submit" isDisabled={loading}>
          {loading ? (
            <>
              <LoadingIcon size={16} /> Creando cuenta...
            </>
          ) : (
            'Registrarme'
          )}
        </Button>

        <p className="login-form__switch">
          ¿Ya tenés cuenta?{' '}
          <button type="button" className="login-link" onClick={onGoToLogin}>
            Iniciar sesión
          </button>
        </p>
      </form>
    </>
  );
}
