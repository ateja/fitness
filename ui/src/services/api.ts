import { getToken } from './googleSheets';
import { Exercise, ExerciseResponse } from '../types/exercise';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getAuthHeaders = async () => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in with Google.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const uploadImage = async (file: File): Promise<{ exercises: ExerciseResponse[] }> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in with Google.');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error('Authentication failed. Please sign in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Upload failed');
  }

  return response.json();
};

export const getExercises = async (): Promise<Exercise[]> => {
  const token = await getToken();
  if (!token) {
    throw new Error('Not authenticated. Please sign in with Google.');
  }

  const response = await fetch(`${API_BASE_URL}/exercise/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new Error('Authentication failed. Please sign in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch exercises');
  }

  return response.json();
}; 