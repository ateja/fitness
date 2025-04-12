import React, { useEffect, useState } from 'react';
import './App.css';
import Wizard from './components/Wizard';
import FileUpload from './components/FileUpload';
import { initGoogleSheets, signIn, signOut, isSignedIn, TraineeFile } from './services/googleSheets';

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleApiError, setGoogleApiError] = useState<string | null>(null);
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initGoogleSheets();
        // Check if we have a stored token and restore it
        if (isSignedIn()) {
          setIsAuthenticated(true);
        }
        setLoading(false);
      } catch (err) {
        console.error('Initialization error:', err);
        setGoogleApiError('Failed to initialize Google Sheets API. Please check your credentials and try again.');
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      try {
        setIsAuthenticated(isSignedIn());
      } catch (err) {
        console.error('Auth check error:', err);
        setGoogleApiError('Error checking authentication status');
      }
    };
    checkAuth();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const success = await signIn();
      setIsAuthenticated(success);
    } catch (err) {
      console.error('Sign in error:', err);
      setGoogleApiError('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    try {
      signOut();
      setIsAuthenticated(false);
      setSelectedTrainee(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setGoogleApiError('Failed to sign out');
    }
  };

  const handleLoadWorkout = (trainee: TraineeFile) => {
    setSelectedTrainee(trainee);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (googleApiError) {
    return <div className="error">{googleApiError}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="sign-in-container">
        <div className="sign-in-content">
          <h1 className="sign-in-title">Fitness Tracker</h1>
          <p className="sign-in-message">Please sign in to access your workout data</p>
          <button 
            onClick={handleSignIn} 
            className="button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Fitness Tracker</h1>
        <button onClick={handleSignOut} className="button">
          Sign Out
        </button>
      </div>
      <Wizard 
        onLoadWorkout={handleLoadWorkout}
      />
      {selectedTrainee && (
        <FileUpload 
          traineeName={selectedTrainee.name}
          traineeId={selectedTrainee.id}
        />
      )}
    </div>
  );
}

export default App;
