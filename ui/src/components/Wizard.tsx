import React, { useState } from 'react';
import './Wizard.css';
import TraineesDropdown from './TraineesDropdown';
import WorkoutPanel from './WorkoutPanel';
import { TraineeFile, WorkoutData } from '../services/googleSheets';

interface WizardProps {
  onLoadWorkout: (trainee: TraineeFile) => void;
}

const Wizard: React.FC<WizardProps> = ({ onLoadWorkout }) => {
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeFile | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([]);

  const handleTraineeSelect = async (trainee: TraineeFile) => {
    setSelectedTrainee(trainee);
    setWorkoutData([]);
    onLoadWorkout(trainee);
  };

  return (
    <div className="wizard-container">
      <h2 className="wizard-title">Workout Wizard</h2>
      <div className="trainee-selection">
        <TraineesDropdown onTraineeSelect={handleTraineeSelect} />
      </div>
      {selectedTrainee && (
        <div className="workout-panels">
          {workoutData.map((data, index) => (
            <WorkoutPanel 
              key={`${data.exercise}-${index}`}
              exercise={data.exercise}
              sets={data.sets}
              traineeName={selectedTrainee.name}
              traineeId={selectedTrainee.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wizard; 