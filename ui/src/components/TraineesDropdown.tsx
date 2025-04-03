import React, { useState, useEffect } from 'react';
import './TraineesDropdown.css';
import { listTraineeFiles, TraineeFile } from '../services/googleSheets';

interface TraineesDropdownProps {
  onTraineeSelect: (trainee: TraineeFile) => void;
}

const TraineesDropdown: React.FC<TraineesDropdownProps> = ({ onTraineeSelect }) => {
  const [trainees, setTrainees] = useState<TraineeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrainees = async () => {
      try {
        const traineeFiles = await listTraineeFiles();
        setTrainees(traineeFiles);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trainees:', err);
        setError('Failed to load trainees');
        setLoading(false);
      }
    };

    fetchTrainees();
  }, []);

  if (loading) {
    return <div className="dropdown-loading">Loading trainees...</div>;
  }

  if (error) {
    return <div className="dropdown-error">{error}</div>;
  }

  return (
    <div className="trainees-dropdown">
      <label htmlFor="trainee-select">Trainee:</label>
      <select 
        id="trainee-select"
        onChange={(e) => {
          const selectedTrainee = trainees.find(t => t.id === e.target.value);
          if (selectedTrainee) {
            onTraineeSelect(selectedTrainee);
          }
        }}
        className="trainee-select"
      >
        <option value="">Select a trainee</option>
        {trainees.map((trainee) => (
          <option key={trainee.id} value={trainee.id}>
            {trainee.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TraineesDropdown; 