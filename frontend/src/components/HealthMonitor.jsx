import React from 'react';
import { ActivityIcon, RefreshIcon, CheckCircleIcon, AlertTriangleIcon } from './Icons';

export function HealthMonitor({ healthData, isLoading, onRefresh, lastChecked }) {
  const cards = [
    {
      id: 'api',
      title: 'API Gateway Availability',
      endpoint: 'GET /',
      description: 'Verifies FastAPI root endpoint via Nginx reverse proxy',
      data: healthData.api,
    },
    {
      id: 'app',
      title: 'Application Health',
      endpoint: 'GET /health',
      description: 'Checks internal application runtime and health check status',
      data: healthData.app,
    },
    {
      id: 'db',
      title: 'Database Connectivity',
      endpoint: 'GET /db-health',
      description: 'Executes ping check (SELECT 1) directly against MySQL 8.4',
      data: healthData.db,
    },
    {
      id: 'items',
      title: 'Database API Access',
      endpoint: 'GET /items',
      description: 'Queries items table records from MySQL database',
      data: healthData.items,
    },
  ];

  return (
    <section id="health" className="card">
      <div className="card-header">
        <div className="card-title">
          <ActivityIcon color="var(--primary)" />
          <span>System Health Monitoring</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {lastChecked && (
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Checked: {lastChecked}
            </span>
          )}
          <button
            className="btn btn-secondary"
            onClick={onRefresh}
            disabled={isLoading}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            {isLoading ? <span className="spinner" /> : <RefreshIcon size={13} />}
            <span>Check Now</span>
          </button>
        </div>
      </div>

      <div className="health-grid">
        {cards.map((c) => {
          const isHealthy = c.data?.ok;
          const statusClass = isLoading ? 'loading' : isHealthy ? 'healthy' : 'error';

          return (
            <div key={c.id} className={`health-card ${statusClass}`}>
              <div className="hc-top">
                <span className="hc-endpoint mono">{c.endpoint}</span>
                <span className={`hc-status-badge ${statusClass}`}>
                  {isLoading ? (
                    'Checking...'
                  ) : isHealthy ? (
                    <>
                      <CheckCircleIcon size={12} color="var(--success)" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangleIcon size={12} color="var(--danger)" />
                      <span>Failed</span>
                    </>
                  )}
                </span>
              </div>

              <div>
                <h3 className="hc-name">{c.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  {c.description}
                </p>
              </div>

              <div className="hc-meta">
                <div className="hc-row">
                  <span>Responding Instance:</span>
                  {c.data?.instance ? (
                    <span className={`instance-badge mono ${c.data.instance}`}>
                      {c.data.instance}
                    </span>
                  ) : (
                    <span className="mono" style={{ color: 'var(--text-dim)' }}>N/A</span>
                  )}
                </div>

                <div className="hc-row">
                  <span>HTTP Status:</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {c.data?.statusCode ? `${c.data.statusCode} ${c.data.statusText || ''}` : 'Unknown'}
                  </span>
                </div>

                <div className="hc-row">
                  <span>Latency:</span>
                  <span className="mono">
                    {c.data?.latency != null ? `${c.data.latency} ms` : '—'}
                  </span>
                </div>

                {c.id === 'items' && c.data?.count != null && (
                  <div className="hc-row">
                    <span>Records Found:</span>
                    <span className="mono" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {c.data.count} items
                    </span>
                  </div>
                )}
              </div>

              {c.data?.error && (
                <div className="error-box mono">
                  <strong>Error:</strong> {c.data.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
