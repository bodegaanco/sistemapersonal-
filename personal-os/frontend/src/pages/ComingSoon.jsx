import { Construction } from 'lucide-react';

export default function ComingSoon({ title }) {
  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-20 text-center animate-enter">
      <Construction size={28} className="mx-auto mb-4 text-[var(--color-text-dim)]" />
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm mx-auto">
        Este módulo llega en la próxima etapa de construcción del proyecto. El dashboard, checklist, tareas y hábitos ya están completamente funcionales.
      </p>
    </div>
  );
}
