// Exercise last opened on the Log page; History starts on it
export const LAST_OPEN_EXERCISE_KEY = 'lastOpenExerciseId';

// Missing key → null, and ExerciseList stores 'null' when none is open
export const readLastOpenExerciseId = (): number | undefined => {
  const id = Number(
    typeof localStorage === 'undefined'
      ? 0
      : localStorage.getItem(LAST_OPEN_EXERCISE_KEY),
  );
  return Number.isInteger(id) && id > 0 ? id : undefined;
};
