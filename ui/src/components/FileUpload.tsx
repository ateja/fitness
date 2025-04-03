import React, { useState } from 'react';
import './FileUpload.css';
import WorkoutPanel from './WorkoutPanel';
import { WorkoutData } from '../services/googleSheets';

const API_BASE_URL = 'http://localhost:5000';

interface FileUploadProps {
  traineeName: string;
  traineeId: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ traineeName, traineeId }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setWorkoutData([]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploadStatus('Uploading...');
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      console.log('Sending request to server...');
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      if (!data.exercises) {
        console.error('Invalid data structure:', data);
        throw new Error('Invalid response format from server');
      }

      const processedData = data.exercises.map((exercise: any) => ({
        exercise: exercise.name,
        sets: exercise.sets.map((set: any, index: number) => ({
          setNumber: index + 1,
          reps: set.reps.toString(),
          weight: set.weight.toString()
        }))
      }));

      console.log('Processed workout data:', processedData);
      setWorkoutData(processedData);
      setUploadStatus('Upload successful!');
      setSelectedFile(null);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
      setUploadStatus('');
    }
  };

  return (
    <div className="file-upload-container">
      <h3>Upload File</h3>
      <div className="file-upload-controls">
        <input
          type="file"
          onChange={handleFileSelect}
          className="file-input"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className="upload-button"
        >
          Upload
        </button>
      </div>
      {selectedFile && (
        <div className="selected-file">
          Selected file: {selectedFile.name}
        </div>
      )}
      {uploadStatus && (
        <div className="upload-status">
          {uploadStatus}
        </div>
      )}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {workoutData.length > 0 && (
        <div className="workout-panels">
          {workoutData.map((data, index) => (
            <WorkoutPanel 
              key={`${data.exercise}-${index}`}
              exercise={data.exercise}
              sets={data.sets}
              traineeName={traineeName}
              traineeId={traineeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 