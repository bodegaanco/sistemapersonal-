export default function MiniLineChart({ data = [], color = 'var(--color-accent)', height = 140, valueKey = 'value', labelKey = 'label' }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-[var(--color-text-muted)]" style={{ height }}>
        Sin datos todavía.
      </div>
    );
  }

  const width = 600;
  const padding = 24;
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((Number(d[valueKey]) - min) / range) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={color} />
      ))}
      {points.map((p, i) => (
        <text
          key={`label-${i}`}
          x={p.x}
          y={height - 4}
          fontSize="10"
          textAnchor="middle"
          fill="var(--color-text-dim)"
          className="font-mono"
        >
          {p[labelKey]?.slice(5)}
        </text>
      ))}
    </svg>
  );
}
