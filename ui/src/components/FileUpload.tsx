import React, { useState } from 'react';
import './FileUpload.css';

const FileUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
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
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadStatus('Upload successful!');
      setSelectedFile(null);
    } catch (err) {
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
    </div>
  );
};

export default FileUpload; 