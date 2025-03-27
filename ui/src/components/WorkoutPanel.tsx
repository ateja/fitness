import React from 'react';
import { Exercise } from '../types/exercise';
import './WorkoutPanel.css';

interface WorkoutPanelProps {
  selectedExercise: Exercise | null;
}

interface Set {
  weight: number;
  reps: number;
}

const WorkoutPanel: React.FC<WorkoutPanelProps> = ({ selectedExercise }) => {
  const [sets, setSets] = React.useState<Set[]>([
    { weight: 0, reps: 0 },
    { weight: 0, reps: 0 },
    { weight: 0, reps: 0 },
    { weight: 0, reps: 0 }
  ]);

  const handleSetChange = (index: number, field: 'weight' | 'reps', value: string) => {
    const newSets = [...sets];
    newSets[index] = {
      ...newSets[index],
      [field]: value === '' ? 0 : Number(value)
    };
    setSets(newSets);
  };

  if (!selectedExercise) {
    return null;
  }

  return (
    <div className="workout-panel">
      <h2 className="exercise-title">{selectedExercise.name}</h2>
      <div className="sets-container">
        {sets.map((set, index) => (
          <div key={index} className="set-row">
            <span className="set-number">{index + 1}</span>
            <div className="set-inputs">
              <input
                type="number"
                value={set.weight || ''}
                onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                placeholder="Weight"
                min="0"
              />
              <span className="set-separator">×</span>
              <input
                type="number"
                value={set.reps || ''}
                onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                placeholder="Reps"
                min="0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutPanel; 