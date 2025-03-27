export interface FitnessItem {
  id: string;
  name: string;
  category: string;
  description: string;
}

export const sampleExercises: FitnessItem[] = [
  {
    id: '1',
    name: 'Push-ups',
    category: 'Bodyweight',
    description: 'Classic upper body exercise'
  },
  {
    id: '2',
    name: 'Squats',
    category: 'Bodyweight',
    description: 'Lower body compound exercise'
  },
  {
    id: '3',
    name: 'Bench Press',
    category: 'Weight Training',
    description: 'Chest and triceps exercise with barbell'
  },
  {
    id: '4',
    name: 'Running',
    category: 'Cardio',
    description: 'Outdoor or treadmill running'
  },
  {
    id: '5',
    name: 'Plank',
    category: 'Core',
    description: 'Core stability exercise'
  }
]; 