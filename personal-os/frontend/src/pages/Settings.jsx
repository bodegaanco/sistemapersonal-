import { useEffect, useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, Sun, Moon, Search, Command } from 'lucide-react';
import api, { BASE_URL } from '../api/client';
import Card from '../components/Card';

export default function Settings() {
  const [settings, setSettings] = useState({ user_name: '', theme: 'dark' });
  const [saved, setSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('/settings').then(setSettings);
  }, []);

  async function save(e) {
    e.preventDefault();
    await api.put('/settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function toggleTheme() {
    const theme = settings.theme === 'light' ? 'dark' : 'light';
    setSettings((s) => ({ ...s, theme }));
    document.documentElement.setAttribute('data-theme', theme);
    await api.put('/settings', { theme });
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

  async function downloadFile(path, filename) {
    const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportMessage('');

    if (!confirm('Esto reemplazará TODOS tus datos actuales con los del respaldo. ¿Quieres continuar?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await api.post('/backup/import', parsed);
      setImportMessage('Respaldo importado correctamente. Recarga la página para ver los datos.');
    } catch (err) {
      setImportError('No se pudo importar el archivo. Verifica que sea un respaldo válido de Personal OS.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
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

      <Card className="mb-6">
        <h2 className="text-sm font-medium mb-4">Apariencia</h2>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors px-4 py-2.5 rounded-xl text-sm"
        >
          {settings.theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          Cambiar a modo {settings.theme === 'light' ? 'oscuro' : 'claro'}
        </button>
      </Card>

      <Card className="mb-6">
        <h2 className="text-sm font-medium mb-1">Buscador global y atajos</h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          Busca en tareas, hábitos, gym, calendario, finanzas y objetivos desde cualquier pantalla.
        </p>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <Search size={13} /> Abrir buscador:
          <span className="flex items-center gap-1 font-mono bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded px-2 py-0.5">
            <Command size={11} /> K
          </span>
          <span>o Ctrl + K en Windows</span>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-sm font-medium mb-4">Datos</h2>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => downloadFile('/export/excel', `personal-os-${new Date().toISOString().slice(0, 10)}.xlsx`)}
            className="flex items-center gap-2 bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors px-4 py-2.5 rounded-xl text-sm text-left"
          >
            <FileSpreadsheet size={15} className="text-[var(--color-success)]" />
            Descargar todo en Excel (.xlsx)
          </button>
          <button
            onClick={() => downloadFile('/backup/export', `personal-os-backup-${new Date().toISOString().slice(0, 10)}.json`)}
            className="flex items-center gap-2 bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors px-4 py-2.5 rounded-xl text-sm text-left"
          >
            <Download size={15} className="text-[var(--color-accent-strong)]" />
            Exportar respaldo completo (.json)
          </button>
          <label className="flex items-center gap-2 bg-[var(--color-surface-hover)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors px-4 py-2.5 rounded-xl text-sm cursor-pointer">
            <Upload size={15} className="text-[var(--color-warning)]" />
            Importar respaldo (.json)
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
          </label>
          {importMessage && <p className="text-xs text-[var(--color-success)]">{importMessage}</p>}
          {importError && <p className="text-xs text-[var(--color-danger)]">{importError}</p>}
        </div>
        <p className="text-xs text-[var(--color-text-dim)] mt-3">
          Además, el servidor genera automáticamente una copia de seguridad cada vez que se reinicia
          (se conservan las últimas 7). Si desplegaste en Railway, asegúrate de tener un volumen
          persistente montado para que estos respaldos no se pierdan.
        </p>
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
        Las tareas fijas del checklist diario se agregan, editan y eliminan directamente desde la
        sección <strong>Checklist diario</strong>.
      </p>
    </div>
  );
}
