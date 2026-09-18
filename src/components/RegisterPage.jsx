import { useState } from 'react';
import { Button, TextField, Input, Label } from '@heroui/react';
import { register, resendVerificationCode, verifyEmail } from '../api';
import LoadingIcon from './LoadingIcon';

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
    setLoading(true);
    try {
      const response = await verifyEmail(pendingEmail, code);
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
      await resendVerificationCode(pendingEmail);
      setInfo('Te enviamos un nuevo código.');
    } catch (err) {
      setError(err.message || 'No se pudo reenviar el código.');
    } finally {
      setLoading(false);
    }
  }

  if (pendingEmail) {
    return (
      <>
        <h1>Verificá tu email</h1>
        <p className="auth-hint">Ingresá el código de 6 dígitos que enviamos a {pendingEmail}.</p>

        <form className="login-form" onSubmit={handleVerify}>
          <TextField className="auth-field" value={code} onChange={setCode} isRequired>
            <Label>Código de verificación</Label>
            <Input inputMode="numeric" placeholder="123456" maxLength={6} autoFocus />
          </TextField>

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
          <Input type="password" placeholder="Mínimo 6 caracteres" minLength={6} />
        </TextField>

        <TextField className="auth-field" value={confirmPassword} onChange={setConfirmPassword} isRequired>
          <Label>Confirmar contraseña</Label>
          <Input type="password" placeholder="Repetí la contraseña" minLength={6} />
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
