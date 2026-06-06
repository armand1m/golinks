import { useState, useMemo } from 'react';
import { compareAsc, eachDayOfInterval, sub, format } from 'date-fns';
import { useTheme } from 'next-themes';
import { LinkUsageMetric } from '../../lib/__generated__/graphql';

const CHART_WIDTH = 300;
const CHART_HEIGHT = 100;
const MARGIN_TOP = 16;
const MARGIN_BOTTOM = 8;
const METRIC_DAYS = 31;
const PATTERN_SIZE = 4;
const HOVER_CIRCLE_RADIUS = 3;
const DASH_ARRAY = '5 5';
const LINE_STROKE_WIDTH = '1.5';

interface Props {
  linkUsageMetrics: Pick<LinkUsageMetric, 'accessedAt'>[];
}

interface Datum {
  count: number;
  date: string;
}

const dateToString = (date: Date) => format(date, 'dd/MM/yyyy');

const convertMetricsToLineChartData = (
  linkUsageMetrics: Pick<LinkUsageMetric, 'accessedAt'>[]
): Datum[] => {
  const now = new Date();
  const days = eachDayOfInterval({
    end: now,
    start: sub(now, { days: METRIC_DAYS }),
  });

  const dates = [
    ...linkUsageMetrics.map((metric) => new Date(metric.accessedAt)),
    ...days,
  ].sort(compareAsc);

  const countPerDate = dates.map(dateToString).reduce(
    (acc, date) => {
      const accCount = acc[date]?.count;
      const count = accCount === undefined ? 0 : accCount + 1;
      return { ...acc, [date]: { date, count } };
    },
    {} as Record<string, Datum>
  );

  return Object.values(countPerDate);
};

const SparklineChart = ({ data }: { data: Datum[] }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(
    null
  );
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const colors = isDark
    ? {
        primary: 'hsl(210, 40%, 70%)',
        primaryLight: 'hsl(210, 40%, 85%)',
      }
    : {
        primary: 'hsl(222.2, 47.4%, 11.2%)',
        primaryLight: 'hsl(222.2, 47.4%, 60%)',
      };

  const chartHeight = CHART_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

  const points = useMemo(
    () =>
      data.map((d, i) => ({
        x: (i / Math.max(data.length - 1, 1)) * CHART_WIDTH,
        y:
          MARGIN_TOP +
          chartHeight -
          (d.count / Math.max(...data.map((v) => v.count), 1)) *
            chartHeight,
      })),
    [data, chartHeight]
  );

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${MARGIN_TOP + chartHeight} L ${points[0].x} ${MARGIN_TOP + chartHeight} Z`;

  return (
    <svg
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      aria-label="Link usage metrics graphic"
      role="img"
      onMouseLeave={() => setHoveredIndex(null)}>
      <defs>
        <pattern
          id="area_pattern"
          width={PATTERN_SIZE}
          height={PATTERN_SIZE}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)">
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={PATTERN_SIZE}
            stroke={colors.primaryLight}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <path d={areaPath} fill="url(#area_pattern)" />
      <path
        d={linePath}
        fill="none"
        stroke={colors.primary}
        strokeWidth={LINE_STROKE_WIDTH}
      />
      {hoveredIndex !== null && (
        <>
          <line
            x1={points[hoveredIndex].x}
            y1={MARGIN_TOP}
            x2={points[hoveredIndex].x}
            y2={MARGIN_TOP + chartHeight}
            stroke={colors.primary}
            strokeWidth="1"
            strokeDasharray={DASH_ARRAY}
          />
          <circle
            cx={points[hoveredIndex].x}
            cy={points[hoveredIndex].y}
            r={HOVER_CIRCLE_RADIUS}
            fill={colors.primary}
          />
          <text
            x={points[hoveredIndex].x}
            y={MARGIN_TOP - 4}
            textAnchor="middle"
            fontSize="11"
            fill={colors.primary}>
            {data[hoveredIndex].date}: {data[hoveredIndex].count}
          </text>
        </>
      )}
      {points.map((p, i) => (
        <rect
          key={i}
          x={Math.max(p.x - 4, 0)}
          y={MARGIN_TOP}
          width={
            i < points.length - 1 ? points[i + 1].x - p.x + 4 : 8
          }
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
  const data = useMemo(
    () => convertMetricsToLineChartData(linkUsageMetrics),
    [linkUsageMetrics]
  );

  return <SparklineChart data={data} />;
};
