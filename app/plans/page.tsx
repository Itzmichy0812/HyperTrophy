import { createClient } from '@/lib/supabase/server';
import { deletePlanAction, duplicatePlanAction, setActivePlanAction } from '@/app/actions/plans';
import Link from 'next/link';
import { PlanDeleteButton } from './plan-delete-button';

export default async function PlansPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from('training_plans')
    .select('*, plan_exercises(count)')
    .order('is_active', { ascending: false })
    .order('updated_at', { ascending: false });

  return (
    <div className="flex-1 space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Training Plans</h1>
      </div>

      {/* Create new plan */}
      <form
        action={async (formData: FormData) => {
          'use server';
          const { createPlanAction } = await import('@/app/actions/plans');
          await createPlanAction(formData);
        }}
        className="flex w-full gap-2"
      >
        <input
          name="name"
          type="text"
          placeholder="New plan name (e.g. Push Day)"
          required
          className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create
        </button>
      </form>

      {/* Plans list */}
      <div className="space-y-3">
        {plans?.map((plan) => {
          const exerciseCount =
            plan.plan_exercises?.[0]?.count ?? 0;

          return (
            <div
              key={plan.id}
              className={`rounded-lg border bg-card p-4 transition-colors ${
                plan.is_active
                  ? 'border-primary/50 ring-1 ring-primary/20'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/plans/${plan.id}`}
                      className="font-semibold hover:underline"
                    >
                      {plan.name}
                    </Link>
                    {plan.is_active && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {!plan.is_active && (
                    <form
                      action={async () => {
                        'use server';
                        await setActivePlanAction(plan.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground min-h-[36px]"
                      >
                        Set Active
                      </button>
                    </form>
                  )}
                  <form
                    action={async () => {
                      'use server';
                      await duplicatePlanAction(plan.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground min-h-[36px]"
                    >
                      Duplicate
                    </button>
                  </form>
                  <PlanDeleteButton planId={plan.id} planName={plan.name} />
                </div>
              </div>
            </div>
          );
        })}
        {(!plans || plans.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            No training plans yet. Create one above!
          </p>
        )}
      </div>
    </div>
  );
}
