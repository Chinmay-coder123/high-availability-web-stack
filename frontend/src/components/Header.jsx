import React from 'react';
import { RefreshIcon } from './Icons';

export function Header({ lastUpdated, onRefreshAll, isRefreshing, overallHealthy }) {
  return (
    <header className="top-header">
      <div className="header-title-block">
        <h2>Infrastructure Operations Center</h2>
        <p>Live Monitoring, Reverse Proxy Load Distribution & Database Operations</p>
      </div>

      <div className="header-actions">
        <div className="status-pill">
          <span className={`dot ${overallHealthy ? 'green' : 'red'} pulse`} />
          <span>{overallHealthy ? 'All Systems Operational' : 'System Degraded'}</span>
        </div>

        {lastUpdated && (
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Updated: {lastUpdated}
          </span>
        )}

        <button 
          className="btn btn-secondary" 
          onClick={onRefreshAll} 
          disabled={isRefreshing}
          title="Refresh all metrics and database records"
        >
          {isRefreshing ? (
            <>
              <span className="spinner" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshIcon size={14} />
              <span>Refresh All</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
