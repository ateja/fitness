import React, { useEffect, useState } from 'react';
import './App.css';
import Wizard from './components/Wizard';
import FileUpload from './components/FileUpload';
import { initGoogleSheets, signIn, signOut, isSignedIn, TraineeFile } from './services/googleSheets';

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleApiError, setGoogleApiError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initGoogleSheets();
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
      const success = await signIn();
      setIsAuthenticated(success);
    } catch (err) {
      console.error('Sign in error:', err);
      setGoogleApiError('Failed to sign in with Google');
    }
  };

  const handleSignOut = () => {
    try {
      signOut();
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Sign out error:', err);
      setGoogleApiError('Failed to sign out');
    }
  };

  const handleLoadWorkout = (trainee: TraineeFile) => {
    // TODO: Implement workout loading logic with the selected trainee
    console.log('Loading workout for trainee:', trainee.name, 'with ID:', trainee.id);
  };

  const handleCreateWorkout = () => {
    // TODO: Implement workout creation logic
    console.log('Create workout clicked');
  };

  if (loading) {
    return <div className="App">Loading...</div>;
  }

  if (googleApiError) {
    return (
      <div className="App">
        <div className="error-message">
          {googleApiError}
          <button onClick={() => window.location.reload()} className="auth-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-container">
        <h1>Fitness Tracker</h1>
        {!isAuthenticated ? (
          <button onClick={handleSignIn} className="auth-button">
            Sign in with Google
          </button>
        ) : (
          <>
            <button onClick={handleSignOut} className="auth-button">
              Sign out
            </button>
            <Wizard
              onLoadWorkout={handleLoadWorkout}
              onCreateWorkout={handleCreateWorkout}
            />
            <FileUpload />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
