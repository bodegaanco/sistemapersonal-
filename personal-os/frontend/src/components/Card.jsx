export default function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
