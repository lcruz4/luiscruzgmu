// Not used yet; uncomment when the log view needs it.

// export interface SetValues {
//   setNumber: number;
//   weight: string | null;
//   reps: number | null;
//   notes: string | null;
// }

// export interface SetRow extends SetValues {
//   saved: boolean;
// }

// interface PlanTarget {
//   sets: number;
//   weight: string | null;
// }

// const draftRow = (setNumber: number, plan: PlanTarget): SetRow => ({
//   setNumber,
//   weight: plan.weight,
//   reps: null,
//   notes: null,
//   saved: false,
// });

// // Saved sets plus drafts up to the plan's set count.
// export const buildSetRows = (
//   plan: PlanTarget,
//   saved: SetValues[],
// ): SetRow[] => {
//   const bySetNumber = new Map(saved.map((set) => [set.setNumber, set]));
//   const count = Math.max(plan.sets, ...saved.map((set) => set.setNumber));
//   const rows: SetRow[] = [];
//   for (let setNumber = 1; setNumber <= count; setNumber++) {
//     const existing = bySetNumber.get(setNumber);
//     rows.push(
//       existing ? { ...existing, saved: true } : draftRow(setNumber, plan),
//     );
//   }
//   return rows;
// };

// export const addSetRow = (rows: SetRow[], plan: PlanTarget): SetRow[] => [
//   ...rows,
//   draftRow(rows.length + 1, plan),
// ];
