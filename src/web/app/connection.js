/**
 * Multi-Transport Connection Manager
 * Handles: Internet (WiFi/Ethernet), Cellular, Starlink, LoRa, Ham Radio, QR Sync
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 */

// Connection types and their priorities (lower = higher priority)
const CONNECTION_TYPES = {
  ETHERNET: { id: 'ethernet', name: 'Ethernet', priority: 1, icon: '🔌' },
  WIFI: { id: 'wifi', name: 'WiFi', priority: 2, icon: '📶' },
  STARLINK: { id: 'starlink', name: 'Starlink', priority: 3, icon: '🛰️' },
  CELLULAR: { id: 'cellular', name: 'Cellular', priority: 4, icon: '📱' },
  LORA: { id: 'lora', name: 'LoRa Mesh', priority: 5, icon: '📡' },
  HAM_RADIO: { id: 'ham', name: 'Ham Radio', priority: 6, icon: '🔊' },
  RADIO: { id: 'radio', name: 'Radio', priority: 7, icon: '📻' },
  QR_CODE: { id: 'qr', name: 'QR Code', priority: 8, icon: '📲' },
  OFFLINE: { id: 'offline', name: 'Offline', priority: 99, icon: '⭕' }
};

// Connection state
const connectionState = {
  type: CONNECTION_TYPES.OFFLINE,
  online: false,
  lastSync: null,
  pendingSync: [],
  listeners: []
};

// Detect connection type (simplified - real implementation would use APIs)
function detectConnectionType() {
  if (!navigator.onLine) {
    return CONNECTION_TYPES.OFFLINE;
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection) {
    const type = connection.type || connection.effectiveType;

    if (type === 'ethernet') return CONNECTION_TYPES.ETHERNET;
    if (type === 'wifi') return CONNECTION_TYPES.WIFI;
    if (type === 'cellular' || type === '4g' || type === '3g' || type === '2g') {
      return CONNECTION_TYPES.CELLULAR;
    }
  }

  // Default to WiFi if online but type unknown
  return CONNECTION_TYPES.WIFI;
}

// Initialize connection monitoring
function initConnection() {
  // Initial detection
  updateConnectionStatus();

  // Monitor online/offline
  window.addEventListener('online', updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);

  // Monitor connection changes
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    connection.addEventListener('change', updateConnectionStatus);
  }

  // Periodic check
  setInterval(updateConnectionStatus, 5000);

  return connectionState;
}

// Update connection status
function updateConnectionStatus() {
  const previousType = connectionState.type;
  const previousOnline = connectionState.online;

  connectionState.online = navigator.onLine;
  connectionState.type = detectConnectionType();

  // Notify listeners if status changed
  if (previousType !== connectionState.type || previousOnline !== connectionState.online) {
    notifyListeners();

    // If we just came online, try to sync
    if (!previousOnline && connectionState.online) {
      syncPendingData();
    }
  }
}

// Add listener for connection changes
function onConnectionChange(callback) {
  connectionState.listeners.push(callback);
  // Return unsubscribe function
  return () => {
    const idx = connectionState.listeners.indexOf(callback);
    if (idx > -1) connectionState.listeners.splice(idx, 1);
  };
}

// Notify all listeners
function notifyListeners() {
  connectionState.listeners.forEach(cb => {
    try {
      cb(connectionState);
    } catch (e) {
      console.error('Connection listener error:', e);
    }
  });

  // Dispatch global event
  window.dispatchEvent(new CustomEvent('connectionchange', { detail: connectionState }));
}

// Queue data for sync when offline
function queueForSync(type, data) {
  const item = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    data,
    timestamp: new Date().toISOString(),
    attempts: 0
  };

  connectionState.pendingSync.push(item);
  savePendingSync();

  return item.id;
}

// Save pending sync to localStorage
function savePendingSync() {
  try {
    localStorage.setItem('dispatch-pending-sync', JSON.stringify(connectionState.pendingSync));
  } catch (e) {
    console.error('Failed to save pending sync:', e);
  }
}

// Load pending sync from localStorage
function loadPendingSync() {
  try {
    const saved = localStorage.getItem('dispatch-pending-sync');
    if (saved) {
      connectionState.pendingSync = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load pending sync:', e);
    connectionState.pendingSync = [];
  }
}

// Attempt to sync pending data
async function syncPendingData() {
  if (!connectionState.online || connectionState.pendingSync.length === 0) {
    return;
  }

  const toSync = [...connectionState.pendingSync];
  const synced = [];

  for (const item of toSync) {
    try {
      item.attempts++;

      // Try to sync via API
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        synced.push(item.id);
      } else if (item.attempts >= 3) {
        // Give up after 3 attempts
        synced.push(item.id);
        console.error('Sync failed after 3 attempts:', item);
      }
    } catch (e) {
      console.error('Sync error:', e);
    }
  }

  // Remove synced items
  connectionState.pendingSync = connectionState.pendingSync.filter(
    item => !synced.includes(item.id)
  );
  savePendingSync();

  connectionState.lastSync = new Date().toISOString();
  notifyListeners();
}

// Get auth token (placeholder - implement based on auth system)
function getAuthToken() {
  return localStorage.getItem('dispatch-auth-token') || '';
}

// Get connection status for UI
function getConnectionStatus() {
  return {
    online: connectionState.online,
    type: connectionState.type,
    typeName: connectionState.type.name,
    icon: connectionState.type.icon,
    lastSync: connectionState.lastSync,
    pendingCount: connectionState.pendingSync.length
  };
}

// Check if specific transport is available
function isTransportAvailable(transportId) {
  // This would check actual hardware availability
  // For now, we simulate
  const available = {
    ethernet: navigator.onLine,
    wifi: navigator.onLine,
    starlink: false, // Would check Starlink API
    cellular: navigator.onLine,
    lora: false, // Would check LoRa hardware
    ham: false, // Would check radio interface
    radio: false,
    qr: true // QR is always "available" as fallback
  };

  return available[transportId] || false;
}

// Generate QR code for offline data transfer
function generateSyncQR(data) {
  // Compress and encode data for QR
  const compressed = btoa(JSON.stringify(data));
  // Return data URL for QR code generation
  return `dispatch://sync?data=${encodeURIComponent(compressed)}`;
}

// Parse QR code data
function parseSyncQR(qrData) {
  try {
    if (qrData.startsWith('dispatch://sync?data=')) {
      const encoded = decodeURIComponent(qrData.replace('dispatch://sync?data=', ''));
      return JSON.parse(atob(encoded));
    }
  } catch (e) {
    console.error('Failed to parse sync QR:', e);
  }
  return null;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONNECTION_TYPES,
    initConnection,
    onConnectionChange,
    queueForSync,
    syncPendingData,
    getConnectionStatus,
    isTransportAvailable,
    generateSyncQR,
    parseSyncQR
  };
}
