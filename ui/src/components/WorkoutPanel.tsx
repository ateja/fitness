import React from 'react';
import './WorkoutPanel.css';
import { Set } from '../services/googleSheets';

interface WorkoutPanelProps {
  exercise: string;
  sets: Set[];
}

const WorkoutPanel: React.FC<WorkoutPanelProps> = ({ exercise, sets }) => {
  return (
    <div className="workout-panel">
      <h2 className="exercise-title">{exercise}</h2>
      <div className="workout-table">
        <div className="table-header">
          <div className="header-cell">#</div>
          <div className="header-cell">Reps</div>
          <div className="header-cell">Weight</div>
        </div>
        <div className="table-body">
          {sets.map((set) => (
            <div key={set.setNumber} className="table-row">
              <div className="table-cell">{set.setNumber}</div>
              <div className="table-cell">{set.reps}</div>
              <div className="table-cell">{set.weight}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkoutPanel; 