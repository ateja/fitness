import { Exercise } from '../types/exercise';

const API_BASE_URL = 'http://localhost:5000';

export const fetchExercises = async (): Promise<Exercise[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/exercise/`);
    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error;
  }
}; 