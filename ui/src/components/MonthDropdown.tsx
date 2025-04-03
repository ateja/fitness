import React, { useState, useEffect } from 'react';
import './MonthDropdown.css';
import { getSheetTabs } from '../services/googleSheets';

interface MonthDropdownProps {
  spreadsheetId: string;
  onMonthSelect: (month: string) => void;
}

const MonthDropdown: React.FC<MonthDropdownProps> = ({ spreadsheetId, onMonthSelect }) => {
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const tabs = await getSheetTabs(spreadsheetId);
        setMonths(tabs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching months:', err);
        setError('Failed to load months');
        setLoading(false);
      }
    };

    if (spreadsheetId) {
      fetchMonths();
    }
  }, [spreadsheetId]);

  if (loading) {
    return <div className="dropdown-loading">Loading months...</div>;
  }

  if (error) {
    return <div className="dropdown-error">{error}</div>;
  }

  return (
    <div className="month-dropdown">
      <label htmlFor="month-select">Pick a month:</label>
      <select 
        id="month-select"
        onChange={(e) => onMonthSelect(e.target.value)}
        className="month-select"
      >
        <option value="">Select a month</option>
        {months.map((month) => (
          <option key={month} value={month}>
            {month}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MonthDropdown; 