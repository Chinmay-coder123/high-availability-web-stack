import React, { useState } from 'react';
import { LayersIcon, ZapIcon } from './Icons';

export function LoadBalancingDemo() {
  const [requestCount, setRequestCount] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);

  const runTest = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    setSummary(null);

    const results = [];
    const counts = {};
    let totalLatency = 0;

    for (let i = 1; i <= requestCount; i++) {
      const startTime = performance.now();
      let status = 'Error';
      let instance = 'Unknown';
      let ok = false;

      try {
        // Send request through Nginx reverse proxy
        const res = await fetch(`/api/health?_t=${Date.now()}_${i}`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });
        const duration = Math.round(performance.now() - startTime);
        totalLatency += duration;
        status = `${res.status} ${res.statusText}`;

        if (res.ok) {
          const data = await res.json();
          instance = data.instance || 'unknown';
          ok = true;
          counts[instance] = (counts[instance] || 0) + 1;
        }

        results.push({
          num: i,
          status,
          instance,
          latency: duration,
          ok,
        });
      } catch (err) {
        const duration = Math.round(performance.now() - startTime);
        totalLatency += duration;
        results.push({
          num: i,
          status: 'Network Error',
          instance: 'Unreachable',
          latency: duration,
          ok: false,
        });
      }

      // Update state incrementally so user sees real-time log
      setLogs([...results]);

      // Small delay between sequential requests to simulate realistic traffic pattern
      await new Promise((r) => setTimeout(r, 60));
    }

    const successfulRequests = results.filter((r) => r.ok).length;
    const avgLatency = results.length > 0 ? Math.round(totalLatency / results.length) : 0;

    setSummary({
      total: results.length,
      successful: successfulRequests,
      avgLatency,
      counts,
    });

    setIsRunning(false);
  };

  return (
    <section id="load-balancer" className="card">
      <div className="card-header">
        <div className="card-title">
          <LayersIcon color="var(--primary)" />
          <span>Load Balancing Demo</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="form-input mono"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', width: 'auto' }}
            value={requestCount}
            onChange={(e) => setRequestCount(Number(e.target.value))}
            disabled={isRunning}
          >
            <option value={5}>5 Requests</option>
            <option value={10}>10 Requests</option>
            <option value={20}>20 Requests</option>
          </select>

          <button
            className="btn btn-primary"
            onClick={runTest}
            disabled={isRunning}
            style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
          >
            {isRunning ? (
              <>
                <span className="spinner" />
                <span>Running ({logs.length}/{requestCount})...</span>
              </>
            ) : (
              <>
                <ZapIcon size={14} />
                <span>Send Test Requests</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="info-banner" style={{ marginBottom: '1.25rem' }}>
        <strong>Architecture Context:</strong> Nginx acts as an upstream load balancer distributing HTTP requests between two containerized FastAPI application replicas (<code>app1</code> and <code>app2</code>).
        Requests are dispatched in real-time, displaying the exact responding <code>INSTANCE_NAME</code> header and round-trip latency.
      </div>

      {summary && (
        <>
          <div className="lb-summary">
            <div className="lb-stat-box">
              <span className="lb-stat-label">Total Requests</span>
              <span className="lb-stat-val mono">{summary.total}</span>
            </div>
            <div className="lb-stat-box">
              <span className="lb-stat-label">Success Rate</span>
              <span className="lb-stat-val mono" style={{ color: 'var(--success)' }}>
                {Math.round((summary.successful / summary.total) * 100)}%
              </span>
            </div>
            <div className="lb-stat-box">
              <span className="lb-stat-label">Avg Response Time</span>
              <span className="lb-stat-val mono">{summary.avgLatency} ms</span>
            </div>

            {Object.entries(summary.counts).map(([inst, count]) => {
              const pct = Math.round((count / summary.successful) * 100);
              return (
                <div key={inst} className="lb-stat-box">
                  <span className="lb-stat-label">{inst} Handled</span>
                  <span className="lb-stat-val mono">
                    {count} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 400 }}>({pct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Visual Distribution Split Bar */}
          {summary.successful > 0 && (
            <div className="distribution-bar">
              {Object.entries(summary.counts).map(([inst, count]) => {
                const widthPct = (count / summary.successful) * 100;
                const sliceClass = inst === 'app-1' ? 'dist-slice-app1' : inst === 'app-2' ? 'dist-slice-app2' : 'dist-slice-other';
                return (
                  <div
                    key={inst}
                    className={sliceClass}
                    style={{ width: `${widthPct}%` }}
                    title={`${inst}: ${count} requests (${Math.round(widthPct)}%)`}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Logs Table / Console */}
      {logs.length > 0 && (
        <div className="table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Seq #</th>
                <th>HTTP Status</th>
                <th>Responding Worker</th>
                <th style={{ textAlign: 'right' }}>Latency</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.num}>
                  <td className="mono" style={{ color: 'var(--text-dim)' }}>
                    #{log.num}
                  </td>
                  <td className="mono" style={{ color: log.ok ? 'var(--success)' : 'var(--danger)' }}>
                    {log.status}
                  </td>
                  <td>
                    {log.instance ? (
                      <span className={`instance-badge mono ${log.instance}`}>
                        {log.instance}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="mono" style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                    {log.latency} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
        <strong>Note on Nginx Load Distribution:</strong> The upstream uses round-robin scheduling by default. 
        In web browsers, persistent HTTP keep-alive connections or TCP connection reuse may occasionally route multiple rapid sequential requests through the same established socket, resulting in minor fluctuations from a strict 50/50 sequence.
      </div>
    </section>
  );
}
