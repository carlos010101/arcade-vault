'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PASSWORD_MIN_LENGTH_REGEX } from '@/lib/validation';

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const passwordValid = PASSWORD_MIN_LENGTH_REGEX.test(pass);
  const signUpBlocked = tab === 'up' && !passwordValid;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (tab === 'in') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push('/biblioteca');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { username: username.toUpperCase().slice(0, 10) },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCheckEmail(true);
  };

  const playAsGuest = () => {
    router.push('/biblioteca');
  };

  const signInWithOAuth = async (provider: 'google' | 'github') => {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  };

  const forgotPassword = async () => {
    const target =
      email || window.prompt('Ingresa tu correo electrónico') || '';
    if (!target) return;
    if (!email) setEmail(target);
    setError(null);
    setResetSent(false);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
  };

  if (checkEmail) {
    return (
      <div className="av-auth-wrap fade-in">
        <div className="auth-card">
          <div className="auth-header">
            <div className="mark"></div>
            <h2 className="neon-cyan">REVISA TU CORREO</h2>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--ink-faint)',
                letterSpacing: '0.16em',
                marginTop: 6,
              }}
            >
              ACCESO AL SISTEMA · v2.6
            </div>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: 'var(--ink-dim)',
              marginTop: 18,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Te enviamos un enlace de confirmación a <strong>{email}</strong>.
            Ábrelo para activar tu cuenta.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              letterSpacing: '0.16em',
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button
            className={tab === 'in' ? 'on' : ''}
            onClick={() => setTab('in')}
          >
            INICIAR SESIÓN
          </button>
          <button
            className={tab === 'up' ? 'on' : ''}
            onClick={() => setTab('up')}
          >
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={submit}>
          {tab === 'up' && (
            <div className="field slide-in">
              <label>Usuario</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="px_kai"
              />
            </div>
          )}
          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
            {tab === 'up' && (
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  marginTop: 4,
                  color: passwordValid ? 'var(--ink-faint)' : 'var(--magenta)',
                }}
              >
                {passwordValid
                  ? 'Mínimo 8 caracteres ✓'
                  : 'Mínimo 8 caracteres'}
              </div>
            )}
          </div>

          {tab === 'in' && (
            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <button
                type="button"
                className="mono"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--ink-faint)',
                  fontSize: 11,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={forgotPassword}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {resetSent && (
            <div
              className="mono"
              style={{ color: 'var(--ink-dim)', fontSize: 11, marginTop: 8 }}
            >
              Te enviamos un enlace de recuperación a tu correo.
            </div>
          )}

          {error && (
            <div
              className="mono"
              style={{ color: 'var(--magenta)', fontSize: 11, marginTop: 8 }}
            >
              {error}
            </div>
          )}

          <button
            className="btn lg"
            type="submit"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading || signUpBlocked}
          >
            {loading
              ? 'PROCESANDO…'
              : tab === 'in'
                ? 'ENTRAR AL VAULT'
                : 'CREAR Y JUGAR'}
          </button>
        </form>

        <button
          className="btn ghost"
          style={{ width: '100%', marginTop: 10 }}
          onClick={playAsGuest}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button
            className="btn ghost"
            type="button"
            onClick={() => signInWithOAuth('google')}
          >
            ◆ GOOGLE
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => signInWithOAuth('github')}
          >
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--ink-faint)',
            letterSpacing: '0.1em',
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
