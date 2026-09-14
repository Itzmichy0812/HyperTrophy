'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Check,
  Trophy,
  Plus,
  Trash2,
  ArrowLeftRight,
  Dumbbell,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRestTimer } from '@/lib/hooks/useRestTimer';
import { useSessionDraft, type SessionDraft } from '@/lib/hooks/useSessionDraft';
import {
  startWorkoutAction,
  logSetAction,
  finishWorkoutAction,
} from '@/app/actions/workouts';
import { formatDuration } from '@/lib/utils/formatters';
import { getUnloggedSetCount } from '@/lib/utils/workout-session';
import { SetRow } from '@/components/workout/SetRow';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PlanSelectorModal,
  type TrainingPlanWithExercises,
} from '@/components/workout/PlanSelectorModal';
import {
  ExercisePickerModal,
  type ExerciseItem,
} from '@/components/workout/ExercisePickerModal';

interface ExerciseState {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: SetState[];
}

interface SetState {
  id?: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir: number | null;
  logged: boolean;
}

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { save, load, clear } = useSessionDraft();
  const restTimer = useRestTimer({ defaultDuration: 90 });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('Workout');
  const [exercises, setExercises] = useState<ExerciseState[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [loggingSet, setLoggingSet] = useState<string | null>(null); // "exIdx-setIdx"
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Plan Selection & Dynamic Exercise state
  const [availablePlans, setAvailablePlans] = useState<TrainingPlanWithExercises[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [swappingExerciseIdx, setSwappingExerciseIdx] = useState<number | null>(null);
  const [exerciseToRemove, setExerciseToRemove] = useState<{
    index: number;
    name: string;
    loggedCount: number;
  } | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  // Initialize: check for draft or prompt plan selection
  useEffect(() => {
    async function init() {
      // Check for existing draft
      const draft = load();
      if (draft) {
        setSessionId(draft.sessionId);
        setExercises(
          draft.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            exerciseName: e.exerciseName,
            muscleGroup: '',
            sets: e.sets,
          })),
        );
        setStartedAt(draft.startedAt);
        setLoading(false);
        return;
      }

      // Check user authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch user's plans for the selector
      const { data: plans } = await supabase
        .from('training_plans')
        .select(
          '*, plan_exercises(*, exercise:exercises(id, name, muscle_group))',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setAvailablePlans((plans as TrainingPlanWithExercises[]) ?? []);
      setShowPlanModal(true);
      setLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartWithPlan = async (plan: TrainingPlanWithExercises | null) => {
    setLoading(true);
    setShowPlanModal(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch last session for pre-fill
      const { data: lastSession } = await supabase
        .from('workout_sessions')
        .select('*, workout_sets(*)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('finished_at', { ascending: false })
        .limit(1)
        .single();

      const lastSets = lastSession?.workout_sets ?? [];

      // Start the session
      const session = await startWorkoutAction(
        plan?.id,
        plan?.name ?? 'Free Workout',
      );
      setSessionId(session.id);
      setSessionName(plan?.name ?? 'Free Workout');
      setStartedAt(session.started_at);

      if (plan?.plan_exercises && plan.plan_exercises.length > 0) {
        const sorted = [...plan.plan_exercises].sort(
          (a, b) => a.sort_order - b.sort_order,
        );

        const exerciseStates: ExerciseState[] = sorted.map((pe) => {
          const prevSets = lastSets.filter(
            (s: { exercise_id: string }) => s.exercise_id === pe.exercise.id,
          );

          const sets: SetState[] = Array.from(
            { length: pe.target_sets || 3 },
            (_, i) => {
              const prev = prevSets.find(
                (s: { set_number: number }) => s.set_number === i + 1,
              );
              return {
                setNumber: i + 1,
                weight: prev?.weight ?? 0,
                reps: prev?.reps ?? pe.target_reps ?? 10,
                rir: pe.target_rir ?? 2,
                logged: false,
              };
            },
          );

          return {
            exerciseId: pe.exercise.id,
            exerciseName: pe.exercise.name,
            muscleGroup: pe.exercise.muscle_group,
            sets,
          };
        });

        setExercises(exerciseStates);
      } else {
        setExercises([]);
      }
    } catch (err) {
      console.error('Failed to start workout with plan:', err);
      toast.error('Không thể khởi tạo buổi tập. Vui lòng thử lại.');
      setShowPlanModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Save draft on changes
  useEffect(() => {
    if (!sessionId || !startedAt) return;
    const draft: SessionDraft = {
      sessionId,
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        sets: e.sets,
      })),
      startedAt,
    };
    save(draft);
  }, [exercises, sessionId, startedAt, save]);

  const handleLogSet = useCallback(
    async (exerciseIndex: number, setIndex: number) => {
      if (!sessionId) return;
      const key = `${exerciseIndex}-${setIndex}`;
      if (loggingSet === key) return; // Prevent double-tap
      setLoggingSet(key);
      const exercise = exercises[exerciseIndex];
      const set = exercise.sets[setIndex];

      try {
        const loggedSet = await logSetAction(
          sessionId,
          exercise.exerciseId,
          set.setNumber,
          set.weight,
          set.reps,
          set.rir,
        );

        setExercises((prev) => {
          const next = [...prev];
          next[exerciseIndex] = {
            ...next[exerciseIndex],
            sets: next[exerciseIndex].sets.map((s, i) =>
              i === setIndex ? { ...s, id: loggedSet.id, logged: true } : s,
            ),
          };
          return next;
        });

        // Fast visual feedback
        toast.success(
          `Đã lưu Set ${set.setNumber} (${set.weight}kg × ${set.reps})`,
          { duration: 2200 },
        );

        // Auto-start rest timer
        restTimer.start();
      } catch (err) {
        console.error('Failed to log set:', err);
        toast.error('Không thể lưu set này. Vui lòng kiểm tra kết nối và thử lại.', {
          action: {
            label: 'Thử lại',
            onClick: () => handleLogSet(exerciseIndex, setIndex),
          },
          duration: 6000,
        });
      } finally {
        setLoggingSet(null);
      }
    },
    [sessionId, exercises, restTimer, loggingSet],
  );

  const handleUpdateSetField = useCallback(
    (
      exerciseIndex: number,
      setIndex: number,
      field: 'weight' | 'reps' | 'rir',
      value: number | null,
    ) => {
      setExercises((prev) => {
        const next = [...prev];
        next[exerciseIndex] = {
          ...next[exerciseIndex],
          sets: next[exerciseIndex].sets.map((s, i) =>
            i === setIndex ? { ...s, [field]: value } : s,
          ),
        };
        return next;
      });
    },
    [],
  );

  const handleAddSet = useCallback((exerciseIndex: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const exercise = next[exerciseIndex];
      const lastSet = exercise.sets[exercise.sets.length - 1];
      next[exerciseIndex] = {
        ...exercise,
        sets: [
          ...exercise.sets,
          {
            setNumber: exercise.sets.length + 1,
            weight: lastSet?.weight ?? 0,
            reps: lastSet?.reps ?? 10,
            rir: lastSet?.rir ?? 2,
            logged: false,
          },
        ],
      };
      return next;
    });
  }, []);

  const handleSelectExercise = async (exercise: ExerciseItem) => {
    // Fetch previous sets for this exercise if user logged it previously
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let prevWeight = 0;
    let prevReps = 10;
    let prevRir = 2;

    if (user) {
      const { data: prevSets } = await supabase
        .from('workout_sets')
        .select('weight, reps, rir')
        .eq('user_id', user.id)
        .eq('exercise_id', exercise.id)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (prevSets && prevSets.length > 0) {
        prevWeight = prevSets[0].weight;
        prevReps = prevSets[0].reps;
        prevRir = prevSets[0].rir ?? 2;
      }
    }

    const defaultSets: SetState[] = Array.from({ length: 3 }, (_, i) => ({
      setNumber: i + 1,
      weight: prevWeight,
      reps: prevReps,
      rir: prevRir,
      logged: false,
    }));

    if (swappingExerciseIdx !== null) {
      // Swapping existing exercise
      const oldName = exercises[swappingExerciseIdx]?.exerciseName;
      setExercises((prev) => {
        const next = [...prev];
        next[swappingExerciseIdx] = {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          muscleGroup: exercise.muscle_group,
          sets: defaultSets,
        };
        return next;
      });
      toast.success(`Đã đổi "${oldName}" thành "${exercise.name}"!`);
      setSwappingExerciseIdx(null);
    } else {
      // Adding new exercise
      const newExercise: ExerciseState = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscle_group,
        sets: defaultSets,
      };
      setExercises((prev) => [...prev, newExercise]);
      toast.success(`Đã thêm bài "${exercise.name}" vào buổi tập!`);
    }
  };

  const handlePromptRemoveExercise = (exerciseIndex: number) => {
    const exercise = exercises[exerciseIndex];
    if (!exercise) return;

    const loggedCount = exercise.sets.filter((s) => s.logged).length;
    if (loggedCount === 0) {
      // No sets logged yet, safe to remove instantly
      setExercises((prev) => prev.filter((_, idx) => idx !== exerciseIndex));
      toast.info(`Đã bỏ bài "${exercise.exerciseName}" khỏi buổi tập.`);
    } else {
      // Sets already logged, confirm with user
      setExerciseToRemove({
        index: exerciseIndex,
        name: exercise.exerciseName,
        loggedCount,
      });
    }
  };

  const confirmRemoveExercise = () => {
    if (!exerciseToRemove) return;
    setExercises((prev) => prev.filter((_, idx) => idx !== exerciseToRemove.index));
    toast.info(`Đã bỏ bài "${exerciseToRemove.name}" khỏi buổi tập.`);
    setExerciseToRemove(null);
  };

  const handlePromptSwapExercise = (exerciseIndex: number) => {
    setSwappingExerciseIdx(exerciseIndex);
    setShowExercisePicker(true);
  };

  const executeFinish = async () => {
    if (!sessionId) return;
    setFinishing(true);
    try {
      await finishWorkoutAction(sessionId);
      clear();
      toast.success('Tuyệt vời! Bạn đã hoàn thành buổi tập!', { duration: 3000 });
      router.push('/workouts');
    } catch (err) {
      console.error('Failed to finish workout:', err);
      setFinishing(false);
      toast.error('Không thể kết thúc buổi tập. Vui lòng thử lại.');
    }
  };

  const handleFinish = () => {
    if (!sessionId) return;
    const unloggedSetCount = getUnloggedSetCount(exercises);
    if (unloggedSetCount > 0) {
      setShowFinishDialog(true);
      return;
    }
    executeFinish();
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    setShowCancelDialog(false);
    clear();
    toast.info('Đã hủy buổi tập.');
    router.push('/dashboard');
  };

  const unloggedCount = getUnloggedSetCount(exercises);
  const firstIncompleteExerciseIdx = exercises.findIndex((e) =>
    e.sets.some((s) => !s.logged),
  );

  if (loading && !showPlanModal) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Đang chuẩn bị buổi tập...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-16">
      {/* Session Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold tracking-tight">{sessionName}</h1>
            <p className="text-sm font-medium tabular-nums text-muted-foreground">
              {formatDuration(elapsed)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={finishing}
              className="h-11 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 cursor-pointer"
              aria-label="Cancel workout and discard unlogged sets"
            >
              Cancel
            </button>
            <button
              onClick={handleFinish}
              disabled={finishing}
              className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {finishing ? 'Finishing...' : 'Finish'}
            </button>
          </div>
        </div>

        {/* Rest Timer */}
        {restTimer.isRunning && (
          <div className="mt-3 rounded-lg bg-card border border-border p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Rest Timer</span>
              <span className="text-xl font-bold tabular-nums">
                {formatDuration(restTimer.remaining)}
              </span>
              <button
                onClick={restTimer.stop}
                className="h-11 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
                aria-label="Skip rest timer"
              >
                Skip
              </button>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary/40">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000 motion-reduce:transition-none"
                style={{ width: `${restTimer.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Exercise Cards with Visual Hierarchy & Dynamic Management */}
      <div className="space-y-4 p-4 max-w-2xl mx-auto">
        {exercises.map((exercise, exIdx) => {
          const isCompleted =
            exercise.sets.length > 0 && exercise.sets.every((set) => set.logged);
          const isCurrentExercise = exIdx === firstIncompleteExerciseIdx;
          const nextUnloggedSetIdx = exercise.sets.findIndex((set) => !set.logged);
          const loggedSetsCount = exercise.sets.filter((set) => set.logged).length;
          const totalSetsCount = exercise.sets.length;

          return (
            <div
              key={`${exercise.exerciseId}-${exIdx}`}
              className={`rounded-xl border overflow-hidden transition-all duration-200 ${
                isCompleted
                  ? 'border-border/50 bg-card/60 opacity-80'
                  : isCurrentExercise
                  ? 'border-primary/50 bg-card shadow-md ring-1 ring-primary/20'
                  : 'border-border bg-card'
              }`}
            >
              {/* Exercise header with Swap & Remove actions */}
              <div className="border-b border-border/80 px-4 py-3 bg-muted/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="break-words font-semibold text-base">{exercise.exerciseName}</h2>
                      {isCompleted && (
                        <Badge
                          variant="secondary"
                          className="text-[11px] gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        >
                          <Check className="size-3" aria-hidden="true" />
                          Hoàn thành
                        </Badge>
                      )}
                      {isCurrentExercise && (
                        <Badge className="text-[11px] bg-primary text-primary-foreground font-semibold">
                          Đang tập
                        </Badge>
                      )}
                    </div>
                    {exercise.muscleGroup && (
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        {exercise.muscleGroup}
                      </span>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground block">
                        {loggedSetsCount}/{totalSetsCount} sets
                      </span>
                      {isCurrentExercise && nextUnloggedSetIdx !== -1 && (
                        <span className="text-[11px] text-primary font-medium block">
                          Set {nextUnloggedSetIdx + 1} of {totalSetsCount}
                        </span>
                      )}
                    </div>

                    {/* Quick action buttons: Swap / Remove */}
                    <div className="flex items-center gap-0.5 border-l border-border/80 pl-2">
                      <button
                        type="button"
                        onClick={() => handlePromptSwapExercise(exIdx)}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Đổi sang bài tập khác"
                        aria-label={`Đổi bài tập ${exercise.exerciseName}`}
                      >
                        <ArrowLeftRight className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePromptRemoveExercise(exIdx)}
                        className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Bỏ bài tập này"
                        aria-label={`Bỏ bài tập ${exercise.exerciseName}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Set header row */}
              <div className="grid grid-cols-[2.25rem_1fr_1fr_3.25rem_4.5rem] gap-2 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:px-4">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>RIR</span>
                <span></span>
              </div>

              {/* Sets */}
              <div className="space-y-1 p-1">
                {exercise.sets.map((set, setIdx) => (
                  <SetRow
                    key={setIdx}
                    isActive={isCurrentExercise && setIdx === nextUnloggedSetIdx}
                    isLogging={loggingSet === `${exIdx}-${setIdx}`}
                    logged={set.logged}
                    onFieldChange={(field, value) =>
                      handleUpdateSetField(exIdx, setIdx, field, value)
                    }
                    onLog={() => handleLogSet(exIdx, setIdx)}
                    reps={set.reps}
                    rir={set.rir}
                    setNumber={set.setNumber}
                    weight={set.weight}
                  />
                ))}
              </div>

              {/* Add set button */}
              <button
                onClick={() => handleAddSet(exIdx)}
                className="min-h-11 w-full border-t border-border/80 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring cursor-pointer"
              >
                + Add Set
              </button>
            </div>
          );
        })}

        {/* Empty state when no exercises in session */}
        {exercises.length === 0 && (
          <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl bg-card/50">
            <Dumbbell className="size-8 mx-auto text-primary/60 mb-2" />
            <p className="font-semibold text-base text-foreground">
              Chưa có bài tập nào trong buổi tập
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Hãy bấm nút bên dưới để chọn bài tập từ thư viện và bắt đầu buổi tập hôm nay!
            </p>
            <button
              type="button"
              onClick={() => {
                setSwappingExerciseIdx(null);
                setShowExercisePicker(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
            >
              <Plus className="size-4" /> Thêm bài tập đầu tiên
            </button>
          </div>
        )}

        {/* Button to add an exercise into the active session */}
        {exercises.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSwappingExerciseIdx(null);
              setShowExercisePicker(true);
            }}
            className="w-full py-3.5 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="size-4" /> Thêm bài tập vào buổi tập
          </button>
        )}
      </div>

      {/* Plan Selector Modal when starting workout */}
      <PlanSelectorModal
        open={showPlanModal}
        plans={availablePlans}
        onSelectPlan={handleStartWithPlan}
        onClose={() => router.push('/dashboard')}
      />

      {/* Exercise Picker Modal for adding / swapping exercises */}
      <ExercisePickerModal
        open={showExercisePicker}
        title={
          swappingExerciseIdx !== null
            ? `Đổi bài "${exercises[swappingExerciseIdx]?.exerciseName}"`
            : 'Thêm bài tập vào buổi tập'
        }
        excludeExerciseIds={exercises.map((e) => e.exerciseId)}
        onSelectExercise={handleSelectExercise}
        onClose={() => {
          setShowExercisePicker(false);
          setSwappingExerciseIdx(null);
        }}
      />

      {/* Dialog xác nhận bỏ bài tập khi đã có hiệp được log */}
      <Dialog
        open={!!exerciseToRemove}
        onOpenChange={(isOpen) => !isOpen && setExerciseToRemove(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <DialogTitle>Bỏ bài tập &quot;{exerciseToRemove?.name}&quot;?</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              Bài tập này đã có {exerciseToRemove?.loggedCount} hiệp được ghi nhận. Nếu bỏ bài, các hiệp này sẽ không còn trong buổi tập hiện tại. Bạn có chắc chắn muốn bỏ bài này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <button
              type="button"
              onClick={() => setExerciseToRemove(null)}
              className="h-11 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Giữ lại bài tập
            </button>
            <button
              type="button"
              onClick={confirmRemoveExercise}
              className="h-11 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors cursor-pointer"
            >
              Xác nhận bỏ bài
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận kết thúc khi còn set chưa log */}
      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="size-5" />
              <DialogTitle>Còn {unloggedCount} set chưa hoàn thành</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              Bạn vẫn còn {unloggedCount} set chưa được ghi nhận trong buổi tập. Bạn có chắc chắn muốn kết thúc và lưu buổi tập này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <button
              type="button"
              onClick={() => setShowFinishDialog(false)}
              className="h-11 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Tiếp tục tập
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFinishDialog(false);
                executeFinish();
              }}
              className="h-11 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              {finishing ? 'Đang lưu...' : 'Vẫn kết thúc'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận hủy buổi tập */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <DialogTitle>Hủy buổi tập này?</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              Tất cả các set chưa lưu sẽ bị hủy và bạn sẽ quay về Dashboard. Bạn có chắc chắn muốn hủy không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <button
              type="button"
              onClick={() => setShowCancelDialog(false)}
              className="h-11 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Tiếp tục tập
            </button>
            <button
              type="button"
              onClick={confirmCancel}
              className="h-11 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-colors cursor-pointer"
            >
              Xác nhận hủy
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
