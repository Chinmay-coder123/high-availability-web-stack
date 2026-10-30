import React from 'react';
import { DatabaseIcon, RefreshIcon, AlertTriangleIcon } from './Icons';

export function DatabaseExplorer({ items, isLoading, error, onRefresh }) {
  const formatPrice = (price) => {
    const num = Number(price);
    if (isNaN(num)) return price;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <DatabaseIcon color="var(--primary)" />
          <span>Database Explorer</span>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
            ({items.length} records in MySQL)
          </span>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onRefresh}
          disabled={isLoading}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
        >
          {isLoading ? <span className="spinner" /> : <RefreshIcon size={13} />}
          <span>Refresh Table</span>
        </button>
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangleIcon size={16} />
          <span><strong>Failed to load records:</strong> {error}</span>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th>Item Name</th>
              <th style={{ textAlign: 'right', width: '150px' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && items.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                    <span className="spinner" />
                    <span>Querying database records from MySQL...</span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="3">
                  <div className="empty-state">
                    <DatabaseIcon size={32} color="var(--text-dim)" />
                    <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>No items in the database yet</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Use the "Add New Item" form on the right to insert a record.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="mono" style={{ color: 'var(--text-dim)' }}>
                    #{item.id}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                    {item.name}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>
                    {formatPrice(item.price)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
