import { useState } from 'react';
import { Button, TextField, Input, Label } from '@heroui/react';
import { login, resendVerificationCode, verifyEmail } from '../api';
import LoadingIcon from './LoadingIcon';

// El backend responde este mensaje cuando la cuenta existe pero no verificó el email.
const UNVERIFIED_MESSAGE_PART = 'Verificá tu email';

export default function LoginPage({ onSuccess, onGoToRegister }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  // Modo verificación: la cuenta existe pero nunca se confirmó el email
  // (ej. se cerró el popup de registro). Permite verificar y entrar sin
  // tener que registrarse de nuevo.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verifyEmailAddress, setVerifyEmailAddress] = useState('');
  const [code, setCode] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const response = await login(identifier, password, needsTotp ? totpCode : undefined);
      onSuccess(response);
    } catch (err) {
      if (err.totpRequired) {
        setNeedsTotp(true);
      }
      const message = err.message || 'No se pudo iniciar sesión.';
      if (!err.totpRequired && message.includes(UNVERIFIED_MESSAGE_PART)) {
        // La contraseña ya pasó la validación: solo falta verificar el email.
        setNeedsVerification(true);
        setVerifyEmailAddress(identifier.includes('@') ? identifier : '');
        setInfo('Tu cuenta todavía no verificó el email. Ingresá el código de 6 dígitos o pedí uno nuevo.');
        setError('');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const response = await verifyEmail(verifyEmailAddress, code);
      onSuccess(response);
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
      await resendVerificationCode(verifyEmailAddress);
      setInfo('Te enviamos un nuevo código. Vence en 5 minutos.');
    } catch (err) {
      setError(err.message || 'No se pudo reenviar el código.');
    } finally {
      setLoading(false);
    }
  }

  function backToLogin() {
    setNeedsVerification(false);
    setNeedsTotp(false);
    setCode('');
    setError('');
    setInfo('');
  }

  if (needsVerification) {
    return (
      <>
        <h1>Verificá tu email</h1>
        <p className="auth-hint">Ingresá el email de tu cuenta y el código de 6 dígitos.</p>

        <form className="login-form" onSubmit={handleVerify}>
          <TextField className="auth-field" value={verifyEmailAddress} onChange={setVerifyEmailAddress} isRequired>
            <Label>Email</Label>
            <Input type="email" placeholder="vos@ejemplo.com" autoFocus />
          </TextField>

          <TextField className="auth-field" value={code} onChange={setCode} isRequired>
            <Label>Código de verificación</Label>
            <Input inputMode="numeric" placeholder="123456" maxLength={6} />
          </TextField>

          {error && <p className="error">{error}</p>}
          {info && <p className="auth-hint">{info}</p>}

          <Button type="submit" variant="primary" className="auth-submit" isDisabled={loading}>
            {loading ? (
              <>
                <LoadingIcon size={16} /> Verificando...
              </>
            ) : (
              'Verificar y entrar'
            )}
          </Button>

          <Button type="button" variant="ghost" onClick={handleResend} isDisabled={loading}>
            Reenviar código
          </Button>

          <p className="login-form__switch">
            <button type="button" className="login-link" onClick={backToLogin}>
              Volver al inicio de sesión
            </button>
          </p>
        </form>
      </>
    );
  }

  return (
    <>
      <h1>Iniciar sesión</h1>
      <p className="auth-hint">
        {needsTotp
          ? 'Ingresá el código de 6 dígitos de tu app de autenticación.'
          : 'Entrá con tu email o tu nombre de usuario.'}
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
        {!needsTotp && (
          <>
            <TextField
              className="auth-field"
              value={identifier}
              onChange={setIdentifier}
              isRequired
            >
              <Label>Email o usuario</Label>
              <Input placeholder="vos@ejemplo.com o tu_usuario" autoFocus />
            </TextField>

            <TextField
              className="auth-field"
              value={password}
              onChange={setPassword}
              isRequired
            >
              <Label>Contraseña</Label>
              <Input type="password" placeholder="••••••••" />
            </TextField>
          </>
        )}

        {needsTotp && (
          <TextField className="auth-field" value={totpCode} onChange={setTotpCode} isRequired>
            <Label>Código de verificación</Label>
            <Input inputMode="numeric" placeholder="123456" maxLength={6} autoFocus />
          </TextField>
        )}

        {error && <p className="error">{error}</p>}
        {info && <p className="auth-hint">{info}</p>}

        <Button type="submit" variant="primary" className="auth-submit" isDisabled={loading}>
          {loading ? (
            <>
              <LoadingIcon size={16} /> Ingresando...
            </>
          ) : (
            'Ingresar'
          )}
        </Button>

        <p className="login-form__switch">
          ¿No tenés cuenta?{' '}
          <button type="button" className="login-link" onClick={onGoToRegister}>
            Registrarte
          </button>
        </p>
      </form>
    </>
  );
}
