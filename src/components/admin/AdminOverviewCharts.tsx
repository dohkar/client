"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REGION_LABELS as REGION_LABELS_FROM_CONST } from "@/lib/search-constants";
import React from "react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#AA336A",
  "#B6C867",
];

const TYPE_LABELS: Record<string, string> = {
  HOUSE: "Дом",
  APARTMENT: "Квартира",
  LAND: "Земля",
  COMMERCIAL: "Коммерция",
};

const REGION_LABELS: Record<string, string> = {
  CHECHNYA: "Чечня",
  INGUSHETIA: "Ингушетия",
  DAGESTAN: "Дагестан",
  NORTH_OSSETIA: "Северная Осетия",
  KABARDINO_BALKARIA: "Кабардино-Балкария",
  KARACHAY_CIRCASSIA: "Карачаево-Черкесия",
  OTHER: "Другие",
  ...REGION_LABELS_FROM_CONST, // объединяем, если регионов много
};

type Stats = {
  overview: Record<string, number>;
  propertiesByType: Array<{ type: string; count: number }>;
  propertiesByRegion: Array<{ region: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  usersDailyStats?: Array<{ date: string; count: number }>;
};

// Utility types so that data fields except 'count' are always string, but 'count' is number
type LocalizableChartItem<TField extends string> = Record<TField, string> & {
  count: number;
};

/**
 * Преобразует массив данных под русские подписи.
 */
function getLocalizedChartData<TField extends string>(
  data: Array<LocalizableChartItem<TField>>,
  labels: Record<string, string>,
  keyName: TField
): Array<LocalizableChartItem<TField>> {
  return data.map((item) => ({
    ...item,
    [keyName]: labels[item[keyName]] || item[keyName],
  }));
}

/**
 * Кастомная легенда для PieChart, чтобы показывать подписи на русском.
 */
interface PieLegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}
const CustomPieLegend: React.FC<PieLegendProps> = ({ payload = [] }) => (
  <ul className='flex flex-wrap gap-3 text-xs mt-3'>
    {payload.map((entry) => (
      <li className='flex items-center gap-1' key={entry.value}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: entry.color,
          }}
        ></div>
        <span>{entry.value}</span>
      </li>
    ))}
  </ul>
);

/**
 * Кастомная подсказка (tooltip) с поддержкой русских подписей и красивого стиля.
 */
interface TooltipPayloadItem {
  color?: string;
  name?: string;
  value?: string | number;
}
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-white rounded-md shadow-md px-3 py-2 border text-xs'>
        {label && <p className='mb-1 font-semibold'>{label}</p>}
        {payload.map((row, idx) => (
          <p key={idx} style={{ color: row.color }}>
            {row.name}: {row.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminOverviewCharts({ statistics }: { statistics: Stats }) {
  // локализация данных заранее
  const localizedPropertiesByType = getLocalizedChartData(
    statistics.propertiesByType,
    TYPE_LABELS,
    "type"
  );
  const localizedPropertiesByRegion = getLocalizedChartData(
    statistics.propertiesByRegion,
    REGION_LABELS,
    "region"
  );

  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        <Card className='border-primary/20'>
          <CardHeader className='pb-3 sm:pb-6'>
            <CardTitle className='text-base sm:text-lg'>Объявления по типам</CardTitle>
          </CardHeader>
          <CardContent className='px-2 sm:px-6'>
            <ResponsiveContainer width='100%' height={270}>
              <PieChart>
                <Pie
                  data={localizedPropertiesByType}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ type, count }: { type: string; count: number }) =>
                    `${type}: ${count}`
                  }
                  outerRadius={65}
                  fill='#8884d8'
                  dataKey='count'
                  nameKey='type'
                >
                  {localizedPropertiesByType?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign='bottom' content={<CustomPieLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className='border-primary/20'>
          <CardHeader className='pb-3 sm:pb-6'>
            <CardTitle className='text-base sm:text-lg'>Объявления по регионам</CardTitle>
          </CardHeader>
          <CardContent className='px-2 sm:px-6'>
            <ResponsiveContainer width='100%' height={270}>
              <BarChart data={localizedPropertiesByRegion}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='region'
                  angle={-45}
                  textAnchor='end'
                  height={80}
                  className='text-xs'
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey='count' fill='#8884d8'>
                  {localizedPropertiesByRegion.map((_, index) => (
                    <Cell
                      key={`bar-cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4'>
        <Card className='border-primary/20'>
          <CardHeader className='pb-3 sm:pb-6'>
            <CardTitle className='text-base sm:text-lg'>
              Новые объявления за 7 дней
            </CardTitle>
          </CardHeader>
          <CardContent className='px-2 sm:px-6'>
            <ResponsiveContainer width='100%' height={250}>
              <LineChart data={statistics.dailyStats ?? []}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  angle={-45}
                  textAnchor='end'
                  height={80}
                  className='text-xs'
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke='#8884d8'
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name='Объявления'
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className='border-primary/20'>
          <CardHeader className='pb-3 sm:pb-6'>
            <CardTitle className='text-base sm:text-lg'>
              Регистрации по дням (7 дней)
            </CardTitle>
          </CardHeader>
          <CardContent className='px-2 sm:px-6'>
            <ResponsiveContainer width='100%' height={250}>
              <LineChart data={statistics.usersDailyStats ?? []}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='date'
                  angle={-45}
                  textAnchor='end'
                  height={80}
                  className='text-xs'
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type='monotone'
                  dataKey='count'
                  stroke='#00C49F'
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name='Регистрации'
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
