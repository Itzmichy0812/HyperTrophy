import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SetRow } from './SetRow';

describe('SetRow', () => {
  it('provides labelled fields and logs its set with one tap', () => {
    const onFieldChange = vi.fn();
    const onLog = vi.fn();

    render(
      <SetRow
        setNumber={1}
        weight={100}
        reps={8}
        rir={2}
        logged={false}
        isLogging={false}
        onFieldChange={onFieldChange}
        onLog={onLog}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Set 1 weight' }), {
      target: { value: '102.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log set 1' }));

    expect(onFieldChange).toHaveBeenCalledWith('weight', 102.5);
    expect(onLog).toHaveBeenCalledOnce();
  });

  it('announces when a set has been logged', () => {
    render(
      <SetRow
        setNumber={2}
        weight={102.5}
        reps={8}
        rir={1}
        logged
        isLogging={false}
        onFieldChange={vi.fn()}
        onLog={vi.fn()}
      />,
    );

    expect(screen.getByRole('status').textContent).toContain('Set 2 logged');
  });
});
