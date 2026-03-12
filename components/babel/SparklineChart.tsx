type SparklineProps = {
  points: number[];
  width?: number;
  height?: number;
};

export function SparklineChart({ points, width = 120, height = 32 }: SparklineProps) {
  if (!points.length) {
    return <div className="h-8 w-24 rounded bg-white/[0.03]" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const isUp = points[points.length - 1] >= points[0];
  const stroke = isUp ? "#34D399" : "#FB7185";

  const normalizeY = (value: number) => {
    if (max === min) return height / 2;
    return height - ((value - min) / (max - min)) * (height - 4) - 2;
  };

  const path = points
    .map((point, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * (width - 1);
      const y = normalizeY(point);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const endX = width - 1;
  const endY = normalizeY(points[points.length - 1]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-hidden">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${endX} ${height} L 0 ${height} Z`} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={endX} cy={endY} r="2.3" fill={stroke} />
    </svg>
  );
}
