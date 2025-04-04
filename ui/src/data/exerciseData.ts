export interface Exercise {
  name: string;
  force?: string;
  primaryMuscles: string[];
  id: string;
}

// This is a simplified version of your data
// In a real application, you'd load this data from your backend
export const exercises: Exercise[] = [
  {
    id: 'triceps-pushdown',
    name: 'Triceps Pushdown',
    force: 'push',
    primaryMuscles: ['triceps']
  },
  // ... more exercises
]; 