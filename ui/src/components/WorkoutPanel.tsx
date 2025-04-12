import React, { useState } from 'react';
import './WorkoutPanel.css';
import { saveWorkoutData, WorkoutData } from '../services/googleSheets';

interface Set {
  setNumber: number;
  reps: string;
  weight: string;
}

interface WorkoutPanelProps {
  exercise: string;
  sets: Set[];
  traineeName: string;
  traineeId: string;
}

const WorkoutPanel: React.FC<WorkoutPanelProps> = ({ exercise, sets, traineeName, traineeId }) => {
  const [editableSets, setEditableSets] = useState<Set[]>(sets);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getMonthName = (date: string) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = new Date(date).getMonth();
    return monthNames[monthIndex];
  };

  const handleSetChange = (index: number, field: 'reps' | 'weight', value: string) => {
    const newSets = [...editableSets];
    newSets[index] = {
      ...newSets[index],
      [field]: value
    };
    setEditableSets(newSets);
  };

  const handleSave = async () => {
    try {
      setSaveStatus(null);
      const workoutData: WorkoutData[] = [{
        exercise,
        sets: editableSets.map(set => ({
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight
        }))
      }];

      const monthName = getMonthName(selectedDate);
      await saveWorkoutData(traineeId, monthName, workoutData, traineeName, selectedDate);
      setSaveStatus({ type: 'success', message: 'Workout saved successfully!' });
    } catch (error) {
      console.error('Error saving workout:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save workout. Please try again.' });
    }
  };

  return (
    <div className="workout-panel">
      <div className="panel-header">
        <h3>{exercise}</h3>
        <div className="date-picker">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={handleSave} className="save-button">
            Save
          </button>
        </div>
      </div>
      {saveStatus && (
        <div className={`save-status ${saveStatus.type}`}>
          {saveStatus.message}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Set</th>
            <th>Reps</th>
            <th>Weight</th>
          </tr>
        </thead>
        <tbody>
          {editableSets.map((set, index) => (
            <tr key={set.setNumber}>
              <td>{set.setNumber}</td>
              <td>
                <input
                  type="text"
                  value={set.reps}
                  onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={set.weight}
                  onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WorkoutPanel; 