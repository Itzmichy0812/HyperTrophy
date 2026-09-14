interface ExerciseWithSetStatus {
  sets: Array<{ logged: boolean }>;
}

export function getUnloggedSetCount(exercises: ExerciseWithSetStatus[]) {
  return exercises
    .flatMap((exercise) => exercise.sets)
    .filter((set) => !set.logged).length;
}
