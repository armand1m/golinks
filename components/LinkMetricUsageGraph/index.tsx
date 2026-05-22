import { useState } from 'react';
import { compareAsc, eachDayOfInterval, sub, format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { LinkUsageMetric } from '../../lib/__generated__/graphql';

interface Props {
  linkUsageMetrics: Pick<LinkUsageMetric, 'accessedAt'>[];
}

const dateToString = (date: Date) => format(date, 'dd/MM/yyyy', { locale: nl });

interface Datum {
  count: number;
  date: string;
}

const convertMetricsToLineChartData = (
  linkUsageMetrics: Pick<LinkUsageMetric, 'accessedAt'>[]
) => {
  const now = new Date();
  const days = eachDayOfInterval({
    end: now,
    start: sub(now, {
      days: 31,
    }),
  });

  const dates = [
    ...linkUsageMetrics.map((metric) => new Date(metric.accessedAt)),
    ...days,
  ].sort(compareAsc);

  const countPerDate = dates.map(dateToString).reduce((acc, date) => {
    const accCount = acc[date]?.count;
    const count = accCount === undefined ? 0 : accCount + 1;

    return {
      ...acc,
      [date]: {
        date,
        count,
      },
    };
  }, {} as Record<string, Datum>);

  return Object.values(countPerDate);
};

const getThemeColors = () => {
  if (typeof document === 'undefined') {
    return {
      primary: 'hsl(222.2, 47.4%, 11.2%)',
      primaryLight: 'hsl(222.2, 47.4%, 60%)',
    };
  }
  const isDark = document.documentElement.classList.contains('dark');
  return isDark
    ? {
        primary: 'hsl(210, 40%, 70%)',
        primaryLight: 'hsl(210, 40%, 85%)',
      }
    : {
        primary: 'hsl(222.2, 47.4%, 11.2%)',
        primaryLight: 'hsl(222.2, 47.4%, 60%)',
      };
};

const SparklineChart = ({ data }: { data: Datum[] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const colors = getThemeColors();

  const width = 300;
  const height = 100;
  const marginTop = 16;
  const marginBottom = 8;

  const values = data.map((d) => d.count);
  const maxVal = Math.max(...values, 1);
  const chartHeight = height - marginTop - marginBottom;

  const points = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * width,
    y: marginTop + chartHeight - (d.count / maxVal) * chartHeight,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${marginTop + chartHeight} L ${points[0].x} ${marginTop + chartHeight} Z`;

  return (
    <svg
      width={width}
      height={height}
      aria-label="Link usage metrics graphic"
      role="img"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <defs>
        <pattern id="area_pattern" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke={colors.primaryLight} strokeWidth="1" />
        </pattern>
      </defs>
      <path d={areaPath} fill="url(#area_pattern)" />
      <path d={linePath} fill="none" stroke={colors.primary} strokeWidth="1.5" />
      {hoveredIndex !== null && (
        <>
          <line
            x1={points[hoveredIndex].x}
            y1={marginTop}
            x2={points[hoveredIndex].x}
            y2={marginTop + chartHeight}
            stroke={colors.primary}
            strokeWidth="1"
            strokeDasharray="5 5"
          />
          <circle
            cx={points[hoveredIndex].x}
            cy={points[hoveredIndex].y}
            r="3"
            fill={colors.primary}
          />
          <text
            x={points[hoveredIndex].x}
            y={marginTop - 4}
            textAnchor="middle"
            fontSize="11"
            fill={colors.primary}
          >
            {data[hoveredIndex].date}: {data[hoveredIndex].count}
          </text>
        </>
      )}
      {points.map((p, i) => (
        <rect
          key={i}
          x={Math.max(p.x - 4, 0)}
          y={marginTop}
          width={i < points.length - 1 ? points[i + 1].x - p.x + 4 : 8}
          height={chartHeight}
          fill="transparent"
          onMouseMove={() => setHoveredIndex(i)}
        />
      ))}
    </svg>
  );
};

export const LinkMetricUsageGraph: React.FC<Props> = ({
  linkUsageMetrics,
}) => {
  const data = convertMetricsToLineChartData(linkUsageMetrics);

  return <SparklineChart data={data} />;
};
