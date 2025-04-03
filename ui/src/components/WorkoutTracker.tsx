import React, { useState } from 'react';
import WorkoutPanel from './WorkoutPanel';
import { Exercise } from '../types/exercise';

const WorkoutTracker: React.FC = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  return (
    <div className="workout-tracker">
      {selectedExercise && (
        <WorkoutPanel 
          exercise={selectedExercise.name}
          sets={[
            { setNumber: 1, weight: '0', reps: '0' },
            { setNumber: 2, weight: '0', reps: '0' },
            { setNumber: 3, weight: '0', reps: '0' },
            { setNumber: 4, weight: '0', reps: '0' }
          ]}
        />
      )}
    </div>
  );
};

export default WorkoutTracker; 