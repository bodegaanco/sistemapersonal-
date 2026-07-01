// Soporta una serie simple (data + color) o varias series a la vez
// (series = [{ data, color, name }]) que comparten la misma escala.
export default function MiniLineChart({
  data = [], color = 'var(--color-accent)', height = 140,
  valueKey = 'value', labelKey = 'label', series = null,
}) {
  const allSeries = series || [{ data, color }];
  const hasData = allSeries.some((s) => s.data.length > 0);

  if (!hasData) {
    return (
      <div className="flex items-center justify-center text-sm text-[var(--color-text-muted)]" style={{ height }}>
        Sin datos todavía.
      </div>
    );
  }

  const width = 600;
  const padding = 24;
  const allValues = allSeries.flatMap((s) => s.data.map((d) => Number(d[valueKey]) || 0));
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;

  const referenceData = allSeries[0].data;

  function toPoints(seriesData) {
    return seriesData.map((d, i) => {
      const x = padding + (i / Math.max(1, referenceData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((Number(d[valueKey]) - min) / range) * (height - padding * 2);
      return { x, y, ...d };
    });
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      {allSeries.map((s, si) => {
        const points = toPoints(s.data);
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
          <g key={si}>
            <path d={pathD} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color} />
            ))}
          </g>
        );
      })}
      {toPoints(referenceData).map((p, i) => (
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
