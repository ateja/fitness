import React, { useState, useMemo, useEffect, KeyboardEvent } from 'react';
import Fuse from 'fuse.js';
import { Exercise } from '../data/exerciseData';
import './SearchBox.css';

interface Props {
  exercises: Exercise[];
}

const SearchBox: React.FC<Props> = ({ exercises }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Exercise[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const fuse = useMemo(() => new Fuse(exercises, {
    keys: ['name', 'force', 'primaryMuscles'],
    threshold: 0.3,
    includeScore: true
  }), [exercises]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setIsSearching(true);

    if (value.length > 0) {
      const searchResults = fuse.search(value);
      setResults(searchResults.map(result => result.item));
    } else {
      setResults([]);
    }
  };

  const handleItemClick = (item: Exercise) => {
    setSearchTerm(item.name);
    setResults([]);
    setIsSearching(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : -1
        );
        break;
      
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          handleItemClick(results[selectedIndex]);
        }
        break;

      case 'Escape':
        setResults([]);
        setIsSearching(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="search-box-container">
      <div className="search-box">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          onKeyDown={handleKeyDown}
          placeholder="Search exercises..."
          aria-label="Search"
        />
      </div>
      
      {results.length > 0 && isSearching && (
        <div className="search-results">
          {results.map((item, index) => (
            <div 
              key={item.id} 
              className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => handleItemClick(item)}
            >
              <div className="result-name">{item.name}</div>
              <div className="result-details">
                {item.force && <span className="force">{item.force}</span>}
                <span className="muscles">{item.primaryMuscles.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBox; 