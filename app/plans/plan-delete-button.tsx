'use client';

import { deletePlanAction } from '@/app/actions/plans';

interface PlanDeleteButtonProps {
  planId: string;
  planName: string;
}

export function PlanDeleteButton({ planId, planName }: PlanDeleteButtonProps) {
  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${planName}"? This action cannot be undone.`,
    );
    if (!confirmed) return;
    await deletePlanAction(planId);
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 min-h-[36px]"
    >
      Delete
    </button>
  );
}
