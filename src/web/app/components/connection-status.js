/**
 * Connection Status UI Component
 * Displays current transport: WiFi/Cellular/Starlink/LoRa/Ham/Offline
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 */

class ConnectionStatusComponent {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.state = {
      online: false,
      type: 'offline',
      icon: '⭕',
      pendingSync: 0,
      lastSync: null
    };

    if (this.container) {
      this.render();
      this.startListening();
    }
  }

  startListening() {
    // Listen for connection changes
    window.addEventListener('connectionchange', (e) => {
      this.updateState(e.detail);
    });

    // Listen for online/offline
    window.addEventListener('online', () => this.checkConnection());
    window.addEventListener('offline', () => this.checkConnection());

    // Initial check
    this.checkConnection();

    // Periodic check
    setInterval(() => this.checkConnection(), 5000);
  }

  checkConnection() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!navigator.onLine) {
      this.updateState({
        online: false,
        type: { id: 'offline', name: 'Offline', icon: '⭕' }
      });
      return;
    }

    let type = { id: 'wifi', name: 'WiFi', icon: '📶' };

    if (connection) {
      const connType = connection.type || connection.effectiveType;
      if (connType === 'ethernet') {
        type = { id: 'ethernet', name: 'Ethernet', icon: '🔌' };
      } else if (connType === 'cellular' || connType === '4g' || connType === '3g') {
        type = { id: 'cellular', name: 'Cellular', icon: '📱' };
      } else if (connType === '2g' || connType === 'slow-2g') {
        type = { id: 'cellular', name: 'Slow Cellular', icon: '📱' };
      }
    }

    this.updateState({ online: true, type });
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
    if (newState.type) {
      this.state.icon = newState.type.icon;
      this.state.typeName = newState.type.name;
    }
    this.render();
  }

  render() {
    if (!this.container) return;

    const { online, icon, typeName, pendingSync, lastSync } = this.state;

    const statusClass = online ? 'online' : 'offline';
    const pendingBadge = pendingSync > 0
      ? `<span class="pending-badge" aria-label="${pendingSync} pending sync">${pendingSync}</span>`
      : '';

    this.container.innerHTML = `
      <div class="connection-status ${statusClass}" role="status" aria-live="polite">
        <span class="connection-icon" aria-hidden="true">${icon}</span>
        <span class="connection-label">${typeName || (online ? 'Online' : 'Offline')}</span>
        ${pendingBadge}
        <button class="connection-details-btn" aria-label="Connection details" aria-expanded="false">
          <span aria-hidden="true">▾</span>
        </button>
      </div>
      <div class="connection-dropdown" hidden>
        <div class="connection-dropdown-content">
          <div class="transport-list">
            <div class="transport-item ${online ? 'active' : ''}" data-transport="internet">
              <span class="transport-icon">🌐</span>
              <span class="transport-name">Internet</span>
              <span class="transport-status">${online ? '✓' : '✗'}</span>
            </div>
            <div class="transport-item" data-transport="starlink">
              <span class="transport-icon">🛰️</span>
              <span class="transport-name">Starlink</span>
              <span class="transport-status">—</span>
            </div>
            <div class="transport-item" data-transport="lora">
              <span class="transport-icon">📡</span>
              <span class="transport-name">LoRa Mesh</span>
              <span class="transport-status">—</span>
            </div>
            <div class="transport-item" data-transport="ham">
              <span class="transport-icon">🔊</span>
              <span class="transport-name">Ham Radio</span>
              <span class="transport-status">—</span>
            </div>
            <div class="transport-item" data-transport="qr">
              <span class="transport-icon">📲</span>
              <span class="transport-name">QR Code Sync</span>
              <span class="transport-status">✓</span>
            </div>
          </div>
          ${lastSync ? `<div class="last-sync">Last sync: ${this.formatTime(lastSync)}</div>` : ''}
          ${pendingSync > 0 ? `<div class="pending-info">${pendingSync} items waiting to sync</div>` : ''}
          <button class="sync-now-btn" ${!online ? 'disabled' : ''}>Sync Now</button>
        </div>
      </div>
    `;

    // Add event listeners
    const detailsBtn = this.container.querySelector('.connection-details-btn');
    const dropdown = this.container.querySelector('.connection-dropdown');

    if (detailsBtn && dropdown) {
      detailsBtn.addEventListener('click', () => {
        const isHidden = dropdown.hidden;
        dropdown.hidden = !isHidden;
        detailsBtn.setAttribute('aria-expanded', !isHidden);
      });
    }

    const syncBtn = this.container.querySelector('.sync-now-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('requestsync'));
      });
    }
  }

  formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
}

// CSS for the component
const connectionStatusStyles = `
<style>
.connection-status {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-card, #111);
  border: 1px solid var(--border, #222);
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--text, #e0e0e0);
  position: relative;
}

.connection-status.online {
  border-color: var(--accent, #00ff88);
}

.connection-status.offline {
  border-color: #ff4444;
}

.connection-icon {
  font-size: 1rem;
}

.connection-label {
  font-weight: 500;
}

.pending-badge {
  background: #ff8800;
  color: #000;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
}

.connection-details-btn {
  background: none;
  border: none;
  color: var(--text-dim, #888);
  cursor: pointer;
  padding: 0.2rem;
  font-size: 0.8rem;
}

.connection-details-btn:hover {
  color: var(--accent, #00ff88);
}

.connection-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: var(--bg-card, #111);
  border: 1px solid var(--border, #222);
  border-radius: 4px;
  min-width: 200px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.connection-dropdown-content {
  padding: 0.75rem;
}

.transport-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.transport-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  opacity: 0.5;
}

.transport-item.active {
  opacity: 1;
  background: rgba(0, 255, 136, 0.1);
}

.transport-icon {
  font-size: 1rem;
}

.transport-name {
  flex: 1;
  font-size: 0.85rem;
}

.transport-status {
  font-size: 0.8rem;
  color: var(--text-dim, #888);
}

.transport-item.active .transport-status {
  color: var(--accent, #00ff88);
}

.last-sync, .pending-info {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border, #222);
  font-size: 0.8rem;
  color: var(--text-dim, #888);
}

.sync-now-btn {
  margin-top: 0.75rem;
  width: 100%;
  padding: 0.5rem;
  background: var(--accent, #00ff88);
  color: var(--bg, #0a0a0a);
  border: none;
  border-radius: 4px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
}

.sync-now-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sync-now-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}
</style>
`;

// Auto-inject styles
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('div');
  styleEl.innerHTML = connectionStatusStyles;
  document.head.appendChild(styleEl.firstChild);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConnectionStatusComponent;
}
