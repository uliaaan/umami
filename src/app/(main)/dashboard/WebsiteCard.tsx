'use client';
import { Column, Icon, Row, Text, useTheme } from '@umami/react-zen';
import Link from 'next/link';
import { useCallback } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { Favicon } from '@/components/common/Favicon';
import { LoadingPanel } from '@/components/common/LoadingPanel';
import { useDateRange, useLocale, useMessages, useNavigation } from '@/components/hooks';
import { useWebsitePageviewsQuery } from '@/components/hooks/queries/useWebsitePageviewsQuery';
import { useWebsiteStatsQuery } from '@/components/hooks/queries/useWebsiteStatsQuery';
import { ActiveUsers } from '@/components/metrics/ActiveUsers';
import { renderDateLabels } from '@/lib/charts';
import { getThemeColors } from '@/lib/colors';
import { generateTimeSeries } from '@/lib/date';
import { formatLongNumber } from '@/lib/format';
import { MetricCard } from './MetricCard';

function WebsiteCardChart({ websiteId }: { websiteId: string }) {
  const { dateRange } = useDateRange();
  const { startDate, endDate, unit, value } = dateRange;
  const { theme } = useTheme();
  const { locale, dateLocale } = useLocale();
  const { formatMessage, labels } = useMessages();
  const { colors } = getThemeColors(theme);
  const { data, isLoading, isFetching } = useWebsitePageviewsQuery({
    websiteId,
  });

  const { pageviews, sessions } = (data || {}) as any;

  const chartData = data
    ? {
        __id: Date.now(),
        datasets: [
          {
            type: 'bar' as const,
            label: formatMessage(labels.visitors),
            data: generateTimeSeries(sessions, startDate, endDate, unit, dateLocale),
            borderWidth: 1,
            barPercentage: 0.9,
            categoryPercentage: 0.9,
            ...colors.chart.visitors,
            order: 3,
          },
          {
            type: 'bar' as const,
            label: formatMessage(labels.views),
            data: generateTimeSeries(pageviews, startDate, endDate, unit, dateLocale),
            barPercentage: 0.9,
            categoryPercentage: 0.9,
            borderWidth: 1,
            ...colors.chart.views,
            order: 4,
          },
        ],
      }
    : null;

  const renderXLabel = useCallback(renderDateLabels(unit, locale), [unit, locale]);

  return (
    <LoadingPanel data={data} isFetching={isFetching} isLoading={isLoading} minHeight="80px">
      {chartData && (
        <BarChart
          key={value}
          chartData={chartData}
          unit={unit}
          minDate={startDate}
          maxDate={endDate}
          height="150px"
          showLegend={false}
          renderXLabel={renderXLabel}
        />
      )}
    </LoadingPanel>
  );
}

function WebsiteCardMetrics({ websiteId }: { websiteId: string }) {
  const { formatMessage, labels, getErrorMessage } = useMessages();
  const { data, isLoading, isFetching, error } = useWebsiteStatsQuery(websiteId);

  const { pageviews, visitors, visits } = data || {};

  const metrics = data
    ? [
        {
          value: visitors,
          label: formatMessage(labels.visitors),
          formatValue: formatLongNumber,
        },
        {
          value: visits,
          label: formatMessage(labels.visits),
          formatValue: formatLongNumber,
        },
        {
          value: pageviews,
          label: formatMessage(labels.views),
          formatValue: formatLongNumber,
        },
      ]
    : null;

  return (
    <LoadingPanel
      data={metrics}
      isLoading={isLoading}
      isFetching={isFetching}
      error={getErrorMessage(error)}
      minHeight="40px"
    >
      <Row gap="2" alignItems="center" wrap="wrap">
        {metrics?.map((metric, index) => (
          <Row key={metric.label} alignItems="center" gap="2">
            {index > 0 && <Text size="4">·</Text>}
            <MetricCard
              value={metric.value}
              label={metric.label}
              formatValue={metric.formatValue}
              showLabel={true}
            />
          </Row>
        ))}
      </Row>
    </LoadingPanel>
  );
}

export function WebsiteCard({
  website,
}: {
  website: { id: string; name: string; domain: string };
}) {
  const { renderUrl } = useNavigation();

  return (
    <Column gap="3" padding="4" borderRadius="3" border backgroundColor height="100%">
      <Row justifyContent="space-between" alignItems="center">
        <Row gap="2" alignItems="center" minWidth="0">
          <Icon size="md" color="muted">
            <Favicon domain={website.domain} />
          </Icon>
          <Text size="lg" weight="bold" truncate>
            <Link href={renderUrl(`/websites/${website.id}`, false)}>
              {website.domain || website.name}
            </Link>
          </Text>
        </Row>
        <Column alignItems="flex-end" gap="1">
          <ActiveUsers websiteId={website.id} />
        </Column>
      </Row>
      <WebsiteCardMetrics websiteId={website.id} />
      <Column flexGrow={1}>
        <WebsiteCardChart websiteId={website.id} />
      </Column>
    </Column>
  );
}
