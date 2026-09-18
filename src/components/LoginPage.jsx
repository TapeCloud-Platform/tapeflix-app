import { useState } from 'react';
import { Button, TextField, Input, Label } from '@heroui/react';
import { login } from '../api';
import LoadingIcon from './LoadingIcon';

export default function LoginPage({ onSuccess, onGoToRegister }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(identifier, password, needsTotp ? totpCode : undefined);
      onSuccess(response);
    } catch (err) {
      if (err.totpRequired) {
        setNeedsTotp(true);
      }
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
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
