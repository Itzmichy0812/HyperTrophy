'use client';

import Link from 'next/link';
import { Dumbbell, Plus, Sparkles, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PlanExerciseItem {
  id: string;
  sort_order: number;
  target_sets: number;
  target_reps: number;
  target_rir: number;
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
  };
}

export interface TrainingPlanWithExercises {
  id: string;
  name: string;
  is_active: boolean;
  plan_exercises?: PlanExerciseItem[];
}

interface PlanSelectorModalProps {
  open: boolean;
  plans: TrainingPlanWithExercises[];
  onSelectPlan: (plan: TrainingPlanWithExercises | null) => void;
  onClose?: () => void;
}

export function PlanSelectorModal({
  open,
  plans,
  onSelectPlan,
  onClose,
}: PlanSelectorModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border/80">
          <div className="flex items-center gap-2 text-primary">
            <Dumbbell className="size-5" />
            <DialogTitle className="text-lg font-bold">Chọn giáo án hôm nay</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Chọn 1 buổi tập theo giáo án của bạn hoặc bắt đầu buổi tập tự do
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Option: Free Workout */}
          <button
            type="button"
            onClick={() => onSelectPlan(null)}
            className="w-full text-left p-4 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-between group cursor-pointer"
          >
            <div className="space-y-1 min-w-0 pr-3">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  🏋️ Tập tự do (Free Workout)
                </span>
                <Badge variant="outline" className="text-[10px] py-0 border-primary/40 text-primary">
                  Linh hoạt
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tự thêm bài tập tùy ý theo cảm hứng hôm nay
              </p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </button>

          {/* User Plans */}
          {plans.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2 px-1">
                Giáo án của bạn ({plans.length})
              </span>
              <div className="space-y-2.5">
                {plans.map((plan) => {
                  const exercises = plan.plan_exercises ?? [];
                  const muscleGroups = Array.from(
                    new Set(exercises.map((e) => e.exercise?.muscle_group).filter(Boolean)),
                  );

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => onSelectPlan(plan)}
                      className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted/40 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                    >
                      <div className="space-y-1.5 min-w-0 pr-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                            {plan.name}
                          </span>
                          {plan.is_active && (
                            <Badge className="text-[10px] py-0 bg-primary/20 text-primary border-primary/30">
                              <Sparkles className="size-2.5 mr-0.5" /> Gợi ý
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-medium text-foreground/80">
                            {exercises.length} bài tập
                          </span>
                          {muscleGroups.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">
                                {muscleGroups.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {plans.length === 0 && (
            <div className="text-center py-6 px-4 border border-border rounded-xl bg-card">
              <p className="text-sm text-muted-foreground">
                Bạn chưa tạo giáo án nào.
              </p>
              <Link
                href="/plans"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline"
              >
                <Plus className="size-3.5" /> Tạo giáo án trong mục Plans
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
