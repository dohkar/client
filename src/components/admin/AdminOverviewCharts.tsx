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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

type Stats = {
  overview: Record<string, number>;
  propertiesByType: Array<{ type: string; count: number }>;
  propertiesByRegion: Array<{ region: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
  usersDailyStats?: Array<{ date: string; count: number }>;
};

export default function AdminOverviewCharts({ statistics }: { statistics: Stats }) {
  return (
    <>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
        <Card className='border-primary/20'>
          <CardHeader className='pb-3 sm:pb-6'>
            <CardTitle className='text-base sm:text-lg'>Объявления по типам</CardTitle>
          </CardHeader>
          <CardContent className='px-2 sm:px-6'>
            <ResponsiveContainer width='100%' height={250}>
              <PieChart>
                <Pie
                  data={statistics.propertiesByType}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={60}
                  fill='#8884d8'
                  dataKey='count'
                >
                  {statistics.propertiesByType?.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className='border-primary/20'>
          <CardHeader className='pb-3 sm:pb-6'>
            <CardTitle className='text-base sm:text-lg'>Объявления по регионам</CardTitle>
          </CardHeader>
          <CardContent className='px-2 sm:px-6'>
            <ResponsiveContainer width='100%' height={250}>
              <BarChart data={statistics.propertiesByRegion}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis
                  dataKey='region'
                  angle={-45}
                  textAnchor='end'
                  height={80}
                  className='text-xs'
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey='count' fill='#8884d8' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
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
                <Tooltip />
                <Line type='monotone' dataKey='count' stroke='#8884d8' strokeWidth={2} />
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
                <Tooltip />
                <Line type='monotone' dataKey='count' stroke='#00C49F' strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
