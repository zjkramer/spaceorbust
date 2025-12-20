/**
 * Internationalization (i18n) for Dispatch Protocol
 * English + Spanish with easy addition of more languages
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 */

const translations = {
  en: {
    // App
    appName: 'Dispatch Protocol',
    appTagline: 'Free forever. frack predatory private equity.',

    // Navigation
    nav: {
      dashboard: 'Dashboard',
      incidents: 'Incidents',
      units: 'Units',
      map: 'Map',
      reports: 'Reports',
      settings: 'Settings',
      logout: 'Logout'
    },

    // Connection status
    connection: {
      online: 'Online',
      offline: 'Offline',
      syncing: 'Syncing...',
      lastSync: 'Last sync',
      wifi: 'WiFi',
      cellular: 'Cellular',
      starlink: 'Starlink',
      ethernet: 'Ethernet',
      radio: 'Radio',
      hamRadio: 'Ham Radio',
      lora: 'LoRa Mesh',
      satellite: 'Satellite',
      qrCode: 'QR Code Sync'
    },

    // Incidents
    incidents: {
      title: 'Active Incidents',
      new: 'New Incident',
      create: 'Create Incident',
      type: 'Incident Type',
      priority: 'Priority',
      location: 'Location',
      caller: 'Caller',
      narrative: 'Narrative',
      units: 'Assigned Units',
      status: 'Status',
      created: 'Created',
      updated: 'Updated',
      close: 'Close Incident',
      cancel: 'Cancel',
      dispatch: 'Dispatch Unit',
      addNote: 'Add Note',
      history: 'Incident History'
    },

    // Incident types
    incidentTypes: {
      structure_fire: 'Structure Fire',
      vehicle_fire: 'Vehicle Fire',
      brush_fire: 'Brush/Grass Fire',
      medical: 'Medical Emergency',
      mva: 'Motor Vehicle Accident',
      rescue: 'Rescue',
      hazmat: 'Hazardous Materials',
      water_rescue: 'Water Rescue',
      alarm: 'Alarm Activation',
      gas_leak: 'Gas Leak',
      co_alarm: 'CO Alarm',
      power_lines: 'Power Lines Down',
      lockout: 'Lockout/Assist',
      other: 'Other'
    },

    // Priority levels
    priority: {
      critical: 'Critical',
      emergency: 'Emergency',
      urgent: 'Urgent',
      routine: 'Routine',
      scheduled: 'Scheduled'
    },

    // Incident status
    status: {
      pending: 'Pending',
      dispatched: 'Dispatched',
      en_route: 'En Route',
      on_scene: 'On Scene',
      controlled: 'Controlled',
      closed: 'Closed',
      cancelled: 'Cancelled'
    },

    // Units
    units: {
      title: 'Units',
      available: 'Available',
      unavailable: 'Unavailable',
      dispatched: 'Dispatched',
      onScene: 'On Scene',
      enRoute: 'En Route',
      outOfService: 'Out of Service',
      status: 'Status',
      location: 'Location',
      personnel: 'Personnel',
      callsign: 'Callsign'
    },

    // Unit types
    unitTypes: {
      engine: 'Engine',
      ladder: 'Ladder/Truck',
      rescue: 'Rescue',
      ambulance: 'Ambulance',
      chief: 'Chief',
      battalion: 'Battalion',
      tanker: 'Tanker',
      brush: 'Brush',
      hazmat: 'HazMat',
      boat: 'Boat',
      helicopter: 'Helicopter',
      drone: 'Drone'
    },

    // Actions
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      print: 'Print',
      refresh: 'Refresh'
    },

    // Messages
    messages: {
      saved: 'Saved successfully',
      error: 'An error occurred',
      confirm_close: 'Are you sure you want to close this incident?',
      confirm_cancel: 'Are you sure you want to cancel?',
      no_incidents: 'No active incidents',
      no_units: 'No units available',
      offline_mode: 'Working offline. Changes will sync when connected.',
      sync_complete: 'Sync complete',
      sync_failed: 'Sync failed. Will retry.'
    },

    // Time
    time: {
      now: 'Now',
      seconds_ago: 'seconds ago',
      minutes_ago: 'minutes ago',
      hours_ago: 'hours ago',
      today: 'Today',
      yesterday: 'Yesterday'
    },

    // Accessibility
    a11y: {
      skip_to_main: 'Skip to main content',
      menu_open: 'Open menu',
      menu_close: 'Close menu',
      loading: 'Loading',
      required: 'Required',
      error: 'Error',
      success: 'Success',
      warning: 'Warning'
    }
  },

  es: {
    // App
    appName: 'Protocolo de Despacho',
    appTagline: 'Gratis para siempre. Al diablo con el capital privado depredador.',

    // Navigation
    nav: {
      dashboard: 'Panel',
      incidents: 'Incidentes',
      units: 'Unidades',
      map: 'Mapa',
      reports: 'Reportes',
      settings: 'Configuración',
      logout: 'Cerrar Sesión'
    },

    // Connection status
    connection: {
      online: 'En Línea',
      offline: 'Sin Conexión',
      syncing: 'Sincronizando...',
      lastSync: 'Última sincronización',
      wifi: 'WiFi',
      cellular: 'Celular',
      starlink: 'Starlink',
      ethernet: 'Ethernet',
      radio: 'Radio',
      hamRadio: 'Radio Aficionado',
      lora: 'Malla LoRa',
      satellite: 'Satélite',
      qrCode: 'Sincronización QR'
    },

    // Incidents
    incidents: {
      title: 'Incidentes Activos',
      new: 'Nuevo Incidente',
      create: 'Crear Incidente',
      type: 'Tipo de Incidente',
      priority: 'Prioridad',
      location: 'Ubicación',
      caller: 'Reportante',
      narrative: 'Narrativa',
      units: 'Unidades Asignadas',
      status: 'Estado',
      created: 'Creado',
      updated: 'Actualizado',
      close: 'Cerrar Incidente',
      cancel: 'Cancelar',
      dispatch: 'Despachar Unidad',
      addNote: 'Agregar Nota',
      history: 'Historial de Incidentes'
    },

    // Incident types
    incidentTypes: {
      structure_fire: 'Incendio Estructural',
      vehicle_fire: 'Incendio Vehicular',
      brush_fire: 'Incendio de Maleza',
      medical: 'Emergencia Médica',
      mva: 'Accidente Vehicular',
      rescue: 'Rescate',
      hazmat: 'Materiales Peligrosos',
      water_rescue: 'Rescate Acuático',
      alarm: 'Activación de Alarma',
      gas_leak: 'Fuga de Gas',
      co_alarm: 'Alarma de CO',
      power_lines: 'Líneas Eléctricas Caídas',
      lockout: 'Asistencia/Bloqueo',
      other: 'Otro'
    },

    // Priority levels
    priority: {
      critical: 'Crítico',
      emergency: 'Emergencia',
      urgent: 'Urgente',
      routine: 'Rutina',
      scheduled: 'Programado'
    },

    // Incident status
    status: {
      pending: 'Pendiente',
      dispatched: 'Despachado',
      en_route: 'En Camino',
      on_scene: 'En Escena',
      controlled: 'Controlado',
      closed: 'Cerrado',
      cancelled: 'Cancelado'
    },

    // Units
    units: {
      title: 'Unidades',
      available: 'Disponible',
      unavailable: 'No Disponible',
      dispatched: 'Despachado',
      onScene: 'En Escena',
      enRoute: 'En Camino',
      outOfService: 'Fuera de Servicio',
      status: 'Estado',
      location: 'Ubicación',
      personnel: 'Personal',
      callsign: 'Indicativo'
    },

    // Unit types
    unitTypes: {
      engine: 'Autobomba',
      ladder: 'Escalera',
      rescue: 'Rescate',
      ambulance: 'Ambulancia',
      chief: 'Jefe',
      battalion: 'Batallón',
      tanker: 'Cisterna',
      brush: 'Forestal',
      hazmat: 'HazMat',
      boat: 'Lancha',
      helicopter: 'Helicóptero',
      drone: 'Dron'
    },

    // Actions
    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      confirm: 'Confirmar',
      back: 'Atrás',
      next: 'Siguiente',
      submit: 'Enviar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      print: 'Imprimir',
      refresh: 'Actualizar'
    },

    // Messages
    messages: {
      saved: 'Guardado exitosamente',
      error: 'Ocurrió un error',
      confirm_close: '¿Está seguro que desea cerrar este incidente?',
      confirm_cancel: '¿Está seguro que desea cancelar?',
      no_incidents: 'No hay incidentes activos',
      no_units: 'No hay unidades disponibles',
      offline_mode: 'Trabajando sin conexión. Los cambios se sincronizarán al conectar.',
      sync_complete: 'Sincronización completa',
      sync_failed: 'Sincronización fallida. Se reintentará.'
    },

    // Time
    time: {
      now: 'Ahora',
      seconds_ago: 'segundos atrás',
      minutes_ago: 'minutos atrás',
      hours_ago: 'horas atrás',
      today: 'Hoy',
      yesterday: 'Ayer'
    },

    // Accessibility
    a11y: {
      skip_to_main: 'Saltar al contenido principal',
      menu_open: 'Abrir menú',
      menu_close: 'Cerrar menú',
      loading: 'Cargando',
      required: 'Requerido',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia'
    }
  }
};

// Current language
let currentLang = 'en';

// Get browser language preference
function detectLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('es')) return 'es';
  return 'en';
}

// Initialize with browser preference or saved preference
function initI18n() {
  const saved = localStorage.getItem('dispatch-language');
  currentLang = saved || detectLanguage();
  document.documentElement.lang = currentLang;
  return currentLang;
}

// Set language
function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('dispatch-language', lang);
    document.documentElement.lang = lang;
    // Dispatch event for components to update
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  }
}

// Get translation
function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];

  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      // Fallback to English
      value = translations.en;
      for (const k2 of keys) {
        if (value && value[k2] !== undefined) {
          value = value[k2];
        } else {
          return key; // Return key if not found
        }
      }
      return value;
    }
  }

  return value;
}

// Get current language
function getLang() {
  return currentLang;
}

// Get all available languages
function getLanguages() {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' }
  ];
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initI18n, setLanguage, t, getLang, getLanguages };
}
