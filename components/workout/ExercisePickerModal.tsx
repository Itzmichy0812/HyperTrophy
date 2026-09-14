'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Dumbbell, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ExerciseItem {
  id: string;
  name: string;
  muscle_group: string;
}

interface ExercisePickerModalProps {
  open: boolean;
  onSelectExercise: (exercise: ExerciseItem) => void;
  onClose: () => void;
  title?: string;
  excludeExerciseIds?: string[];
}

const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Quads',
  'Hamstrings',
  'Core',
] as const;

export function ExercisePickerModal({
  open,
  onSelectExercise,
  onClose,
  title = 'Thêm bài tập vào buổi tập',
  excludeExerciseIds = [],
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    async function loadExercises() {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .order('muscle_group')
        .order('name');

      if (!error && data) {
        setExercises(data);
      }
      setLoading(false);
    }

    loadExercises();
  }, [open, supabase]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch = ex.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesMuscle =
        selectedMuscle === 'All' || ex.muscle_group === selectedMuscle;
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, search, selectedMuscle]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b border-border/80">
          <div className="flex items-center gap-2 text-primary">
            <Dumbbell className="size-5" />
            <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          </div>

          {/* Search bar */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên bài tập..."
              className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Muscle Group Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto py-2 scrollbar-none no-scrollbar">
            {MUSCLE_GROUPS.map((mg) => (
              <button
                key={mg}
                type="button"
                onClick={() => setSelectedMuscle(mg)}
                className={`h-7 px-2.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedMuscle === mg
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {mg === 'All' ? 'Tất cả' : mg}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Exercise List */}
        <div className="p-3 space-y-1.5 overflow-y-auto flex-1 divide-y divide-border/40">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Đang tải danh sách bài tập...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Không tìm thấy bài tập phù hợp
            </div>
          ) : (
            filteredExercises.map((ex) => {
              const isAlreadyAdded = excludeExerciseIds.includes(ex.id);

              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    onSelectExercise(ex);
                    onClose();
                  }}
                  className="w-full text-left p-3 pt-3 rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                      {ex.name}
                    </p>
                    <span className="text-xs text-muted-foreground mt-0.5 inline-block">
                      {ex.muscle_group}
                    </span>
                  </div>
                  {isAlreadyAdded ? (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                      Đã có
                    </Badge>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Plus className="size-4" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
