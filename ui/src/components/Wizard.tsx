import React, { useState } from 'react';
import './Wizard.css';
import TraineesDropdown from './TraineesDropdown';
import MonthDropdown from './MonthDropdown';
import DateDropdown from './DateDropdown';
import WorkoutPanel from './WorkoutPanel';
import { TraineeFile, getWorkoutData, WorkoutData } from '../services/googleSheets';

interface WizardProps {
  onLoadWorkout: (trainee: TraineeFile) => void;
  onCreateWorkout: () => void;
}

const Wizard: React.FC<WizardProps> = ({ onLoadWorkout, onCreateWorkout }) => {
  const [showTrainees, setShowTrainees] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeFile | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTraineeSelect = (trainee: TraineeFile) => {
    setSelectedTrainee(trainee);
    setSelectedMonth(null); // Reset month selection when trainee changes
    setSelectedDate(null); // Reset date selection when trainee changes
    setWorkoutData([]); // Reset workout data when trainee changes
    onLoadWorkout(trainee);
  };

  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setSelectedDate(null); // Reset date selection when month changes
    setWorkoutData([]); // Reset workout data when month changes
  };

  const handleDateSelect = async (date: string) => {
    if (!selectedTrainee || !selectedMonth) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching workout data...');
      const data = await getWorkoutData(selectedTrainee.id, selectedMonth, date);
      console.log('Received workout data:', data);
      setWorkoutData(data);
      setSelectedDate(date);
    } catch (err) {
      console.error('Error loading workout data:', err);
      setError('Failed to load workout data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wizard-container">
      <h2>Workout Wizard</h2>
      <div className="wizard-buttons">
        <button 
          onClick={() => setShowTrainees(!showTrainees)} 
          className="wizard-button"
        >
          {showTrainees ? 'Hide Load Workout' : 'Load Workout'}
        </button>
        <button onClick={onCreateWorkout} className="wizard-button">
          Create Workout
        </button>
      </div>
      {showTrainees && (
        <>
          <TraineesDropdown onTraineeSelect={handleTraineeSelect} />
          {selectedTrainee && (
            <MonthDropdown 
              spreadsheetId={selectedTrainee.id} 
              onMonthSelect={handleMonthSelect} 
            />
          )}
          {selectedTrainee && selectedMonth && (
            <DateDropdown 
              spreadsheetId={selectedTrainee.id}
              sheetName={selectedMonth}
              onDateSelect={handleDateSelect}
            />
          )}
          {loading && <div className="loading">Loading workout data...</div>}
          {error && <div className="error">{error}</div>}
          {workoutData.length > 0 && (
            <div className="workout-panels">
              {workoutData.map((data, index) => (
                <WorkoutPanel 
                  key={`${data.exercise}-${index}`}
                  exercise={data.exercise}
                  sets={data.sets}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Wizard; 