import React, { useState } from 'react';
import './WorkoutTracker.css';
import WorkoutPanel from './WorkoutPanel';
import { Exercise } from '../types/exercise';

const WorkoutTracker: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [traineeName, setTraineeName] = useState<string>('');
  const [traineeId, setTraineeId] = useState<string>('');

  const handleExerciseSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  return (
    <div className="workout-tracker">
      {selectedExercise && (
        <WorkoutPanel 
          exercise={selectedExercise.name}
          sets={[
            { setNumber: 1, weight: '0', reps: '0' },
            { setNumber: 2, weight: '0', reps: '0' },
            { setNumber: 3, weight: '0', reps: '0' }
          ]}
          traineeName={traineeName}
          traineeId={traineeId}
        />
      )}
    </div>
  );
};

export default WorkoutTracker; 