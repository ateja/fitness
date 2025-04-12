export interface Exercise {
  id: string;
  name: string;
  force?: string;
  primaryMuscles?: string[];
}

export interface ExerciseResponse {
  name: string;
  sets: Array<{
    reps: number;
    weight: number;
  }>;
}

export interface UploadResponse {
  exercises?: ExerciseResponse[];
  error?: string;
}

export interface WorkoutData {
  exercise: string;
  sets: Array<{
    setNumber: number;
    reps: string;
    weight: string;
  }>;
} 