import { Box, Text, useTheme } from 'bumbag';
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

const Tooltip: React.FC<{ datum: Datum }> = ({ datum }) => (
  <Box>
    <Text use="sub">Date: {datum.date}</Text>
    <br />
    <Text use="sub">Usage: {datum.count}</Text>
  </Box>
);

export const LinkMetricUsageGraph: React.FC<Props> = ({
  linkUsageMetrics,
}) => {
  const { theme } = useTheme();
  const data = convertMetricsToLineChartData(linkUsageMetrics);

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
            bottom: theme.spacing.majorUnit * 1,
            top: theme.spacing.majorUnit * 2,
            right: theme.spacing.majorUnit * 3,
          }}
          data={data}
          valueAccessor={(datum: Datum) => datum.count}
          onMouseLeave={onMouseLeave}
          onMouseMove={onMouseMove}>
          <PatternLines
            id="area_pattern"
            height={4}
            width={4}
            stroke={theme.palette.primary300}
            strokeWidth={1}
            orientation={['diagonal']}
          />
          <LineSeries
            showArea
            stroke={theme.palette.primary}
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
              fill={theme.palette.primary}
            />,
          ]}
        </Sparkline>
      )}
    </WithTooltip>
  );
};
