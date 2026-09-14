'use client';

import { Check, Loader2 } from 'lucide-react';

type SetField = 'weight' | 'reps' | 'rir';

interface SetRowProps {
  setNumber: number;
  weight: number;
  reps: number;
  rir: number | null;
  logged: boolean;
  isLogging: boolean;
  isActive?: boolean;
  onFieldChange: (field: SetField, value: number | null) => void;
  onLog: () => void;
}

export function SetRow({
  setNumber,
  weight,
  reps,
  rir,
  logged,
  isLogging,
  isActive = false,
  onFieldChange,
  onLog,
}: SetRowProps) {
  const inputClassName =
    'h-11 min-w-0 rounded-md border border-input bg-background px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-colors';

  if (logged) {
    return (
      <div className="grid grid-cols-[2.25rem_1fr_1fr_3.25rem_4.5rem] items-center gap-2 bg-primary/10 px-3 py-2 sm:px-4 rounded-md transition-all">
        <span className="text-sm font-semibold text-primary">{setNumber}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{weight}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{reps}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{rir ?? '—'}</span>
        <span className="inline-flex items-center justify-end gap-1 text-right text-sm font-medium text-primary" role="status">
          <Check className="size-3.5" aria-hidden="true" />
          Set {setNumber} logged
        </span>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-[2.25rem_1fr_1fr_3.25rem_4.5rem] items-center gap-2 px-3 py-2 sm:px-4 rounded-md transition-all ${
        isActive ? 'bg-primary/5 ring-1 ring-primary/40' : ''
      }`}
    >
      <span className="text-sm font-medium text-muted-foreground">{setNumber}</span>
      <input
        aria-label={`Set ${setNumber} weight`}
        className={inputClassName}
        inputMode="decimal"
        min="0"
        onChange={(event) =>
          onFieldChange('weight', Math.max(0, Number.parseFloat(event.target.value) || 0))
        }
        placeholder="0"
        type="number"
        value={weight || ''}
      />
      <input
        aria-label={`Set ${setNumber} reps`}
        className={inputClassName}
        inputMode="numeric"
        min="0"
        onChange={(event) =>
          onFieldChange('reps', Math.max(0, Number.parseInt(event.target.value, 10) || 0))
        }
        placeholder="0"
        type="number"
        value={reps || ''}
      />
      <input
        aria-label={`Set ${setNumber} RIR`}
        className={inputClassName}
        inputMode="numeric"
        max="10"
        min="0"
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '') {
            onFieldChange('rir', null);
          } else {
            const parsed = Number.parseInt(raw, 10);
            onFieldChange('rir', Number.isNaN(parsed) ? null : Math.min(10, Math.max(0, parsed)));
          }
        }}
        placeholder="—"
        type="number"
        value={rir ?? ''}
      />
      <button
        aria-label={`Log set ${setNumber}`}
        className="h-11 rounded-md bg-primary px-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
        disabled={isLogging}
        onClick={onLog}
        type="button"
      >
        {isLogging ? (
          <>
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
            <span>Saving…</span>
          </>
        ) : (
          'Log'
        )}
      </button>
    </div>
  );
}
