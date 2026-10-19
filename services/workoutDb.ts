import { Pool } from 'pg';

export const workoutPool = new Pool({
  connectionString: process.env.WORKOUT_DB_URL,
});
