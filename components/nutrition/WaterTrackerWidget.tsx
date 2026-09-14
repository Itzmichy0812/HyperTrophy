'use client';

import { useState, useTransition } from 'react';
import { addWaterAction } from '@/app/actions/nutrition';

interface WaterTrackerWidgetProps {
  currentMl: number;
  goalMl: number;
}

export function WaterTrackerWidget({
  currentMl,
  goalMl,
}: WaterTrackerWidgetProps) {
  const [amount, setAmount] = useState(currentMl);
  const [isPending, startTransition] = useTransition();

  const percent = Math.min(100, Math.round((amount / goalMl) * 100));

  function handleAdd(ml: number) {
    const newAmount = amount + ml;
    setAmount(newAmount); // Optimistic update
    startTransition(async () => {
      await addWaterAction(ml);
    });
  }

  return (
    <div className="space-y-4">
      {/* Circular progress */}
      <div className="flex items-center justify-center">
        <div className="relative h-32 w-32">
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              className="text-secondary"
              strokeWidth="2.5"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              className="text-blue-500 transition-all duration-500"
              strokeWidth="2.5"
              strokeDasharray={`${percent}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">{amount}</span>
            <span className="text-xs text-muted-foreground">
              / {goalMl}ml
            </span>
          </div>
        </div>
      </div>

      {/* Quick-add buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => handleAdd(250)}
          disabled={isPending}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          +250ml
        </button>
        <button
          onClick={() => handleAdd(500)}
          disabled={isPending}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          +500ml
        </button>
        <button
          onClick={() => handleAdd(750)}
          disabled={isPending}
          className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          +750ml
        </button>
      </div>
    </div>
  );
}
