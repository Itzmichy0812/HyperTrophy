'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ExerciseProgressDataPoint } from '@/lib/types/database.types';

interface ExerciseProgressChartProps {
  data: ExerciseProgressDataPoint[];
  exerciseName: string;
}

export function ExerciseProgressChart({
  data,
  exerciseName,
}: ExerciseProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-border bg-card p-12">
        <p className="text-sm text-muted-foreground">
          No completed sets found for this exercise yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Estimated 1RM — {exerciseName}
      </h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(0.205 0 0)',
                border: '1px solid oklch(1 0 0 / 10%)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                color: 'oklch(0.985 0 0)',
              }}
              labelStyle={{ color: 'oklch(0.985 0 0)' }}
              formatter={(value, name) => {
                if (name === 'estimated1RM')
                  return [`${value}`, 'Est. 1RM'];
                return [String(value), String(name)];
              }}
            />
            <Line
              type="monotone"
              dataKey="estimated1RM"
              stroke="oklch(0.72 0.19 154)"
              strokeWidth={2}
              dot={{ r: 4, fill: 'oklch(0.72 0.19 154)' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
