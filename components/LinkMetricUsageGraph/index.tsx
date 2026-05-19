import {
  Sparkline,
  LineSeries,
  VerticalReferenceLine,
  PatternLines,
  WithTooltip,
  PointSeries,
  // @ts-ignore
} from '@data-ui/sparkline';
import { compareAsc, eachDayOfInterval, sub } from 'date-fns';
import { formatWithOptions } from 'date-fns/fp';
import { nl } from 'date-fns/locale';
import { LinkUsageMetric } from '../../lib/queries/getAllLinks.graphql';

interface Props {
  linkUsageMetrics: Pick<LinkUsageMetric, 'accessedAt'>[];
}

const dateToString = formatWithOptions({ locale: nl }, 'dd/MM/yyyy');

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

const Tooltip: React.FC<{ datum: Datum }> = ({ datum }) => (
  <div>
    <p className="text-sm text-muted-foreground">
      Date: {datum.date}
    </p>
    <br />
    <p className="text-sm text-muted-foreground">
      Usage: {datum.count}
    </p>
  </div>
);

export const LinkMetricUsageGraph: React.FC<Props> = ({
  linkUsageMetrics,
}) => {
  const data = convertMetricsToLineChartData(linkUsageMetrics);
  const colors = getThemeColors();

  return (
    <WithTooltip renderTooltip={Tooltip}>
      {/* @ts-ignore */}
      {({ onMouseMove, onMouseLeave, tooltipData }) => (
        <Sparkline
          ariaLabel="Link usage metrics graphic"
          width={300}
          height={100}
          margin={{
            left: 0,
            bottom: 8,
            top: 16,
            right: 24,
          }}
          data={data}
          valueAccessor={(datum: Datum) => datum.count}
          onMouseLeave={onMouseLeave}
          onMouseMove={onMouseMove}
        >
          <PatternLines
            id="area_pattern"
            height={4}
            width={4}
            stroke={colors.primaryLight}
            strokeWidth={1}
            orientation={['diagonal']}
          />
          <LineSeries
            showArea
            stroke={colors.primary}
            fill="url(#area_pattern)"
          />
          {tooltipData && [
            <VerticalReferenceLine
              key="ref-line"
              strokeWidth={1}
              reference={tooltipData.index}
              strokeDasharray="5 5"
            />,
            <PointSeries
              key="ref-point"
              points={[tooltipData.index]}
              fill={colors.primary}
            />,
          ]}
        </Sparkline>
      )}
    </WithTooltip>
  );
};
