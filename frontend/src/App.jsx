import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { HealthMonitor } from './components/HealthMonitor';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { AddItemForm } from './components/AddItemForm';
import { LoadBalancingDemo } from './components/LoadBalancingDemo';
import { BackupStatus } from './components/BackupStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState('health');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Health data state
  const [healthData, setHealthData] = useState({
    api: null,
    app: null,
    db: null,
    items: null,
  });
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  // Database items state
  const [items, setItems] = useState([]);
  const [isItemsLoading, setIsItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState(null);

  // Backup data state
  const [backupData, setBackupData] = useState(null);
  const [isBackupLoading, setIsBackupLoading] = useState(true);

  // Helper to fetch with latency and error handling
  const checkEndpoint = async (url) => {
    const start = performance.now();
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      const latency = Math.round(performance.now() - start);
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        // Not JSON
      }

      return {
        ok: res.ok,
        statusCode: res.status,
        statusText: res.statusText,
        latency,
        instance: data?.instance || null,
        data,
        error: !res.ok ? (data?.detail || `HTTP ${res.status} returned`) : null,
      };
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      return {
        ok: false,
        statusCode: 0,
        statusText: 'Unreachable',
        latency,
        instance: null,
        data: null,
        error: err.message || 'Network connection failed',
      };
    }
  };

  // Fetch health metrics
  const fetchHealth = useCallback(async () => {
    setIsHealthLoading(true);

    const [apiRes, appRes, dbRes, itemsRes] = await Promise.all([
      checkEndpoint('/api/'),
      checkEndpoint('/api/health'),
      checkEndpoint('/api/db-health'),
      checkEndpoint('/api/items'),
    ]);

    setHealthData({
      api: apiRes,
      app: appRes,
      db: dbRes,
      items: {
        ...itemsRes,
        count: Array.isArray(itemsRes.data?.items) ? itemsRes.data.items.length : null,
      },
    });

    setIsHealthLoading(false);
  }, []);

  // Fetch items list
  const fetchItems = useCallback(async () => {
    setIsItemsLoading(true);
    setItemsError(null);
    try {
      const res = await fetch('/api/items', {
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || `Failed with status ${res.status}`);
      }
      setItems(data.items || []);
    } catch (err) {
      setItemsError(err.message || 'Failed to load items.');
    } finally {
      setIsItemsLoading(false);
    }
  }, []);

  // Fetch backup status
  const fetchBackup = useCallback(async () => {
    setIsBackupLoading(true);
    try {
      const res = await fetch('/api/backup-status', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setBackupData(data);
      }
    } catch (err) {
      // Backup endpoint error handled gracefully
    } finally {
      setIsBackupLoading(false);
    }
  }, []);

  // Refresh everything
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchHealth(), fetchItems(), fetchBackup()]);
    setLastUpdated(new Date().toLocaleTimeString());
    setIsRefreshing(false);
  }, [fetchHealth, fetchItems, fetchBackup]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Compute overall system health status
  const overallHealthy =
    healthData.api?.ok &&
    healthData.app?.ok &&
    healthData.db?.ok &&
    healthData.items?.ok;

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        <Header
          lastUpdated={lastUpdated}
          onRefreshAll={refreshAll}
          isRefreshing={isRefreshing}
          overallHealthy={overallHealthy}
        />

        <div className="page-body">
          {/* Feature 1: System Health Monitoring */}
          <HealthMonitor
            healthData={healthData}
            isLoading={isHealthLoading}
            onRefresh={fetchHealth}
            lastChecked={lastUpdated}
          />

          {/* Features 2 & 3: Database Explorer & Add Item Form */}
          <section id="database" className="grid-2-col">
            <DatabaseExplorer
              items={items}
              isLoading={isItemsLoading}
              error={itemsError}
              onRefresh={fetchItems}
            />

            <AddItemForm
              onItemAdded={() => {
                fetchItems();
                fetchHealth();
              }}
            />
          </section>

          {/* Feature 4: Load Balancing Demonstration */}
          <LoadBalancingDemo />

          {/* Feature 5: Backup Monitoring */}
          <BackupStatus
            backupData={backupData}
            isLoading={isBackupLoading}
            onRefresh={fetchBackup}
          />
        </div>
      </main>
    </div>
  );
}
