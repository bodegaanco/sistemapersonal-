import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import api from '../api/client';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.__openGlobalSearch = () => setOpen(true);
    return () => { delete window.__openGlobalSearch; };
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isShortcut) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) return setResults([]);
    const t = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(query.trim())}`).then(setResults).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  function goTo(path) {
    navigate(path);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50 px-4"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden animate-enter"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
          <Search size={16} className="text-[var(--color-text-dim)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en toda la app..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
            <X size={15} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => goTo(r.path)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <span className="text-sm truncate">{r.label}</span>
              <span className="text-[10px] text-[var(--color-text-dim)] uppercase shrink-0">{r.type}</span>
            </button>
          ))}
          {query.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-6">Sin resultados.</p>
          )}
          {query.trim().length < 2 && (
            <p className="text-xs text-[var(--color-text-dim)] text-center py-6">
              Escribe al menos 2 letras para buscar en tareas, hábitos, gym, calendario, finanzas y objetivos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
