import type { LoggedDay } from '@/lib/workout/schedule';

export interface Plan {
  id: number;
  name: string;
}

export interface PlanRow {
  id: number;
  week: number;
  day: number;
  position: number;
  exerciseId: number;
  name: string;
  isTimed: boolean;
  sets: number;
  reps: number;
  weight: string | null;
  notes: string | null;
}

export interface LogSet {
  id: number;
  setNumber: number;
  weight: string | null;
  reps: number | null;
  notes: string | null;
}

export interface LogEntry {
  id: number;
  passed: boolean | null;
  notes: string | null;
  sets: LogSet[];
}

export interface LastPerformance extends LogEntry, LoggedDay {}

export interface DayLog extends LogEntry {
  /** ISO time of the first save; the earliest one starts the workout */
  createdAt: string;
}

export interface DayExercise extends PlanRow {
  /** Logged on the requested date */
  log: DayLog | null;
  /** Most recent earlier log of the same exercise, any week/day */
  last: LastPerformance | null;
}

export interface DayResponse {
  plan: Plan;
  week: number;
  day: number;
  date: string;
  /** Latest logged date per week/day, most recent first */
  lastDone: LoggedDay[];
  exercises: DayExercise[];
}

/** null when the change left the log empty and it was deleted */
export interface LogResponse {
  log: DayLog | null;
}

export interface HistoryEntry extends LastPerformance {
  exerciseId: number;
  name: string;
  isTimed: boolean;
  position: number;
}

export interface HistoryResponse {
  entries: HistoryEntry[];
}

export interface PlanResponse {
  plan: Plan;
  rows: PlanRow[];
  dayData?: DayResponse | null;
}
