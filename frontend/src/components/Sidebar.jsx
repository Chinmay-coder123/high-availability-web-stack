import React from 'react';
import { ActivityIcon, DatabaseIcon, LayersIcon, ArchiveIcon, ServerIcon } from './Icons';

export function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'health', label: 'System Health', icon: ActivityIcon },
    { id: 'database', label: 'Database Explorer', icon: DatabaseIcon },
    { id: 'load-balancer', label: 'Load Balancing', icon: LayersIcon },
    { id: 'backups', label: 'Backup Bot', icon: ArchiveIcon },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-badge">HA</div>
        <div className="brand-info">
          <h1>Web Stack</h1>
          <p>High-Availability</p>
        </div>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-link-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <ServerIcon size={14} color="var(--primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Multi-Tier Stack</span>
        </div>
        <div>Nginx (8081) &bull; FastAPI &bull; MySQL 8.4</div>
      </div>
    </aside>
  );
}
