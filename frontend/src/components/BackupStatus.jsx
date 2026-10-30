import React from 'react';
import { ArchiveIcon, RefreshIcon, CheckCircleIcon, AlertTriangleIcon, ShieldCheckIcon } from './Icons';

export function BackupStatus({ backupData, isLoading, onRefresh }) {
  const isAvailable = backupData?.backup_available;
  const latestOpStatus = backupData?.latest_operation_status; // 'success' | 'failure' | 'none'
  const isLatestOpSuccess = latestOpStatus === 'success';

  return (
    <section id="backups" className="card">
      <div className="card-header">
        <div className="card-title">
          <ArchiveIcon color="var(--primary)" />
          <span>Automated Backup Bot Status</span>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isLoading}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
        >
          {isLoading ? <span className="spinner" /> : <RefreshIcon size={13} />}
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="health-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {/* Backup Availability */}
        <div className="lb-stat-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lb-stat-label">Backup Volume</span>
            {isAvailable ? (
              <span className="hc-status-badge healthy" style={{ fontSize: '0.65rem' }}>
                <CheckCircleIcon size={11} color="var(--success)" />
                Available
              </span>
            ) : (
              <span className="hc-status-badge error" style={{ fontSize: '0.65rem' }}>
                <AlertTriangleIcon size={11} color="var(--danger)" />
                No Files Found
              </span>
            )}
          </div>
          <span className="lb-stat-val mono" style={{ fontSize: '1.25rem', marginTop: '0.35rem' }}>
            {backupData?.backup_count != null ? `${backupData.backup_count} Archives` : '—'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Stored in persistent volume <code>backup_data</code>
          </span>
        </div>

        {/* Latest Operation Status */}
        <div className="lb-stat-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="lb-stat-label">Latest Operation</span>
            {latestOpStatus === 'success' ? (
              <span className="hc-status-badge healthy" style={{ fontSize: '0.65rem' }}>
                <CheckCircleIcon size={11} color="var(--success)" />
                Success
              </span>
            ) : latestOpStatus === 'failure' ? (
              <span className="hc-status-badge error" style={{ fontSize: '0.65rem' }}>
                <AlertTriangleIcon size={11} color="var(--danger)" />
                Failed
              </span>
            ) : (
              <span className="hc-status-badge" style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                Pending / Idle
              </span>
            )}
          </div>
          <span className="lb-stat-val mono" style={{ fontSize: '1.25rem', marginTop: '0.35rem' }}>
            {latestOpStatus ? latestOpStatus.toUpperCase() : 'UNKNOWN'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Recorded: <span className="mono">{backupData?.latest_operation_timestamp || 'N/A'}</span>
          </span>
        </div>

        {/* Configured Interval */}
        <div className="lb-stat-box">
          <span className="lb-stat-label">Backup Interval</span>
          <span className="lb-stat-val mono" style={{ fontSize: '1.25rem', marginTop: '0.35rem', color: 'var(--primary)' }}>
            {backupData?.configured_interval_human || '6 hours'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Configured in <code>backup.sh</code> ({backupData?.backup_interval_seconds || 21600}s)
          </span>
        </div>

        {/* Latest Backup File */}
        <div className="lb-stat-box" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <span className="lb-stat-label">Most Recent Successful Archive</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Verified <code>gzip -t</code> integrity
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className="mono"
              style={{
                background: 'var(--bg-main)',
                padding: '0.4rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-light)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                flex: 1,
              }}
            >
              {backupData?.latest_backup_file || 'No backup archive generated yet'}
            </span>

            {backupData?.latest_backup_timestamp && (
              <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Timestamp: {backupData.latest_backup_timestamp}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <ShieldCheckIcon size={14} color="var(--success)" />
        <span>
          <strong>Security Assurance:</strong> Application containers mount the backup storage as <code>read-only</code> (<code>:ro</code>). Database credentials, restoration keys, and Docker daemon sockets are not exposed to the client.
        </span>
      </div>
    </section>
  );
}
