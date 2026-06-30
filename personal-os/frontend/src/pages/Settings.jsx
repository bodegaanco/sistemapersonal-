import { useEffect, useState } from 'react';
import api from '../api/client';
import Card from '../components/Card';

export default function Settings() {
  const [settings, setSettings] = useState({ user_name: '' });
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    api.get('/settings').then(setSettings);
  }, []);

  async function save(e) {
    e.preventDefault();
    await api.put('/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function changePassword(e) {
    e.preventDefault();
    setPwError('');
    setPwMessage('');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPwMessage('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwError(err.message);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 md:px-10 py-10 animate-enter">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Ajustes</h1>

      <Card className="mb-6">
        <form onSubmit={save} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] block mb-1.5">Tu nombre</label>
            <input
              value={settings.user_name || ''}
              onChange={(e) => setSettings((s) => ({ ...s, user_name: e.target.value }))}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </div>
          <button
            type="submit"
            className="self-start bg-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            {saved ? 'Guardado ✓' : 'Guardar cambios'}
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="text-sm font-medium mb-4">Cambiar contraseña de acceso</h2>
        <form onSubmit={changePassword} className="flex flex-col gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Contraseña actual"
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nueva contraseña (mínimo 6 caracteres)"
            className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          {pwError && <p className="text-xs text-[var(--color-danger)]">{pwError}</p>}
          {pwMessage && <p className="text-xs text-[var(--color-success)]">{pwMessage}</p>}
          <button
            type="submit"
            className="self-start bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors px-4 py-2.5 rounded-xl text-sm font-medium"
          >
            Actualizar contraseña
          </button>
        </form>
      </Card>

      <p className="text-xs text-[var(--color-text-dim)] mt-6">
        Más opciones (tema claro/oscuro, importar/exportar datos, respaldos automáticos, tareas fijas del checklist) llegarán en la etapa de ajustes y mejoras visuales.
      </p>
    </div>
  );
}
