import React, { useState } from 'react';
import './WorkoutTracker.css';
import WorkoutPanel from './WorkoutPanel';
import { Exercise } from '../types/exercise';
import { exercises } from '../data/exerciseData';

const WorkoutTracker: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  return (
    <div className="workout-tracker">
      <div className="exercise-list">
        {exercises.map((exercise) => (
          <button
            key={exercise.id}
            className={`exercise-button ${selectedExercise?.id === exercise.id ? 'selected' : ''}`}
            onClick={() => handleExerciseSelect(exercise)}
          >
            {exercise.name}
          </button>
        ))}
      </div>
      {selectedExercise && (
        <WorkoutPanel 
          exercise={selectedExercise.name}
          sets={[
            { setNumber: 1, weight: '0', reps: '0' },
            { setNumber: 2, weight: '0', reps: '0' },
            { setNumber: 3, weight: '0', reps: '0' }
          ]}
          traineeName=""
          traineeId=""
        />
      )}
    </div>
  );
};

export default WorkoutTracker; 