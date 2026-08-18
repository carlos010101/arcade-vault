'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PASSWORD_MIN_LENGTH_REGEX } from '@/lib/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordValid = PASSWORD_MIN_LENGTH_REGEX.test(pass);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/biblioteca');
  };

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">NUEVA CONTRASEÑA</h2>
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

        <form onSubmit={submit}>
          <div className="field">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
            <div
              className="mono"
              style={{
                fontSize: 11,
                marginTop: 4,
                color: passwordValid ? 'var(--ink-faint)' : 'var(--magenta)',
              }}
            >
              {passwordValid ? 'Mínimo 8 caracteres ✓' : 'Mínimo 8 caracteres'}
            </div>
          </div>

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
            disabled={loading || !passwordValid}
          >
            {loading ? 'GUARDANDO…' : 'GUARDAR CONTRASEÑA'}
          </button>
        </form>
      </div>
    </div>
  );
}
