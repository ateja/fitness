import React, { useEffect, useState } from 'react';
import './App.css';
import SearchBox from './components/SearchBox';
import { fetchExercises } from './services/api';
import { Exercise } from './types/exercise';

function App() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchExercises();
        setExercises(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load exercises');
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  if (loading) {
    return <div className="App">Loading exercises...</div>;
  }

  if (error) {
    return <div className="App">Error: {error}</div>;
  }

  return (
    <div className="App">
      <div className="search-container">
        <h1>Fitness Tracker</h1>
        <SearchBox exercises={exercises} />
      </div>
    </div>
  );
}

export default App;
