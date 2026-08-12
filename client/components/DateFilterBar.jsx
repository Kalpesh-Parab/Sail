// client/components/DateFilterBar.jsx
import React from 'react';
import './DateFilterBar.scss';

const DateFilterBar = ({
  dateRange,
  setDateRange,
  customDates,
  setCustomDates,
  paymentStatus,
  setPaymentStatus,
}) => {
  return (
    <div className="date-filter-card card">
      <div className="filter-group">
        <label>Time Period:</label>
        <div className="btn-group">
          {['CURRENT_MONTH', 'LAST_MONTH', 'THIS_YEAR', 'CUSTOM'].map((type) => (
            <button
              key={type}
              type="button"
              className={dateRange === type ? 'active' : ''}
              onClick={() => setDateRange(type)}
            >
              {type === 'CURRENT_MONTH' && 'Current Month'}
              {type === 'LAST_MONTH' && 'Last Month'}
              {type === 'THIS_YEAR' && 'This Year'}
              {type === 'CUSTOM' && 'Custom Range'}
            </button>
          ))}
        </div>
      </div>

      {dateRange === 'CUSTOM' && (
        <div className="filter-group custom-dates">
          <input
            type="date"
            value={customDates.startDate}
            onChange={(e) =>
              setCustomDates((prev) => ({ ...prev, startDate: e.target.value }))
            }
          />
          <span>to</span>
          <input
            type="date"
            value={customDates.endDate}
            onChange={(e) =>
              setCustomDates((prev) => ({ ...prev, endDate: e.target.value }))
            }
          />
        </div>
      )}

      <div className="filter-group">
        <label>Payment Status:</label>
        <div className="btn-group">
          {['ALL', 'PAID', 'PARTIAL', 'UNPAID'].map((status) => (
            <button
              key={status}
              type="button"
              className={paymentStatus === status ? 'active' : ''}
              onClick={() => setPaymentStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DateFilterBar;