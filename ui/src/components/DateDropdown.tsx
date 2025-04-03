import React, { useState, useEffect } from 'react';
import './DateDropdown.css';
import { getUniqueDates } from '../services/googleSheets';

interface DateDropdownProps {
  spreadsheetId: string;
  sheetName: string;
  onDateSelect: (date: string) => void;
}

const DateDropdown: React.FC<DateDropdownProps> = ({ spreadsheetId, sheetName, onDateSelect }) => {
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const uniqueDates = await getUniqueDates(spreadsheetId, sheetName);
        setDates(uniqueDates);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dates:', err);
        setError('Failed to load dates');
        setLoading(false);
      }
    };

    if (spreadsheetId && sheetName) {
      fetchDates();
    }
  }, [spreadsheetId, sheetName]);

  if (loading) {
    return <div className="dropdown-loading">Loading dates...</div>;
  }

  if (error) {
    return <div className="dropdown-error">{error}</div>;
  }

  return (
    <div className="date-dropdown">
      <label htmlFor="date-select">Pick a date:</label>
      <select 
        id="date-select"
        onChange={(e) => onDateSelect(e.target.value)}
        className="date-select"
      >
        <option value="">Select a date</option>
        {dates.map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateDropdown; 