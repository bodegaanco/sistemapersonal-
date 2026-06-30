import { useState } from 'react';
import { Lock } from 'lucide-react';
import api from '../api/client';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/login', { password });
      onSuccess();
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[var(--color-bg)] px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 animate-enter"
      >
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)] flex items-center justify-center mb-5">
          <Lock size={18} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight mb-1">Personal OS</h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">Ingresa tu contraseña para continuar.</p>

        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] mb-3"
        />

        {error && <p className="text-xs text-[var(--color-danger)] mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
