interface SparklineChartProps {
  data: number[];
  title: string;
  color?: string;
  height?: number;
}

export function SparklineChart({ data, title, color = '#3b82f6', height = 60 }: SparklineChartProps) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200">
      <div className="text-xs text-gray-600 mb-2">{title}</div>
      <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
        />
      </svg>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>7 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}
