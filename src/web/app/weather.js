/**
 * Weather Integration for Dispatch Protocol
 * NWS (National Weather Service) + Fire Weather APIs
 *
 * MIT License - Free forever. frack predatory private equity.
 * https://github.com/zjkramer/spaceorbust
 */

// NWS API base URL (free, no API key required)
const NWS_API = 'https://api.weather.gov';

// Weather state
const weatherState = {
  current: null,
  forecast: null,
  alerts: [],
  fireWeather: null,
  lastUpdate: null,
  location: null,
  listeners: []
};

/**
 * Initialize weather for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 */
async function initWeather(lat, lng) {
  weatherState.location = { lat, lng };

  try {
    // Get NWS grid point for location
    const pointResponse = await fetch(`${NWS_API}/points/${lat},${lng}`, {
      headers: { 'User-Agent': 'DispatchProtocol/1.0 (dispatch@spaceorbust.com)' }
    });

    if (!pointResponse.ok) throw new Error('Failed to get NWS point');

    const pointData = await pointResponse.json();
    weatherState.gridId = pointData.properties.gridId;
    weatherState.gridX = pointData.properties.gridX;
    weatherState.gridY = pointData.properties.gridY;
    weatherState.forecastZone = pointData.properties.forecastZone;
    weatherState.county = pointData.properties.county;
    weatherState.fireWeatherZone = pointData.properties.fireWeatherZone;

    // Initial fetch
    await refreshWeather();

    // Auto-refresh every 10 minutes
    setInterval(refreshWeather, 10 * 60 * 1000);

    return weatherState;
  } catch (error) {
    console.error('[Weather] Init failed:', error);
    return null;
  }
}

/**
 * Refresh all weather data
 */
async function refreshWeather() {
  if (!weatherState.gridId) return;

  try {
    await Promise.all([
      fetchCurrentConditions(),
      fetchForecast(),
      fetchAlerts(),
      fetchFireWeather()
    ]);

    weatherState.lastUpdate = new Date().toISOString();
    notifyListeners();
  } catch (error) {
    console.error('[Weather] Refresh failed:', error);
  }
}

/**
 * Fetch current conditions from nearest observation station
 */
async function fetchCurrentConditions() {
  try {
    const stationsResponse = await fetch(
      `${NWS_API}/gridpoints/${weatherState.gridId}/${weatherState.gridX},${weatherState.gridY}/stations`,
      { headers: { 'User-Agent': 'DispatchProtocol/1.0' } }
    );

    if (!stationsResponse.ok) return;

    const stationsData = await stationsResponse.json();
    const nearestStation = stationsData.features[0]?.properties?.stationIdentifier;

    if (!nearestStation) return;

    const obsResponse = await fetch(
      `${NWS_API}/stations/${nearestStation}/observations/latest`,
      { headers: { 'User-Agent': 'DispatchProtocol/1.0' } }
    );

    if (!obsResponse.ok) return;

    const obsData = await obsResponse.json();
    const props = obsData.properties;

    weatherState.current = {
      temperature: celsiusToFahrenheit(props.temperature?.value),
      humidity: props.relativeHumidity?.value,
      windSpeed: kphToMph(props.windSpeed?.value),
      windDirection: props.windDirection?.value,
      windGust: kphToMph(props.windGust?.value),
      visibility: metersToMiles(props.visibility?.value),
      pressure: props.barometricPressure?.value,
      description: props.textDescription,
      icon: props.icon,
      timestamp: props.timestamp
    };
  } catch (error) {
    console.error('[Weather] Current conditions failed:', error);
  }
}

/**
 * Fetch forecast
 */
async function fetchForecast() {
  try {
    const response = await fetch(
      `${NWS_API}/gridpoints/${weatherState.gridId}/${weatherState.gridX},${weatherState.gridY}/forecast`,
      { headers: { 'User-Agent': 'DispatchProtocol/1.0' } }
    );

    if (!response.ok) return;

    const data = await response.json();
    weatherState.forecast = data.properties.periods.slice(0, 8).map(p => ({
      name: p.name,
      temperature: p.temperature,
      temperatureUnit: p.temperatureUnit,
      windSpeed: p.windSpeed,
      windDirection: p.windDirection,
      shortForecast: p.shortForecast,
      detailedForecast: p.detailedForecast,
      icon: p.icon,
      isDaytime: p.isDaytime
    }));
  } catch (error) {
    console.error('[Weather] Forecast failed:', error);
  }
}

/**
 * Fetch active weather alerts
 */
async function fetchAlerts() {
  try {
    const { lat, lng } = weatherState.location;
    const response = await fetch(
      `${NWS_API}/alerts/active?point=${lat},${lng}`,
      { headers: { 'User-Agent': 'DispatchProtocol/1.0' } }
    );

    if (!response.ok) return;

    const data = await response.json();
    weatherState.alerts = data.features.map(f => ({
      id: f.properties.id,
      event: f.properties.event,
      severity: f.properties.severity,
      certainty: f.properties.certainty,
      urgency: f.properties.urgency,
      headline: f.properties.headline,
      description: f.properties.description,
      instruction: f.properties.instruction,
      onset: f.properties.onset,
      expires: f.properties.expires,
      senderName: f.properties.senderName
    }));
  } catch (error) {
    console.error('[Weather] Alerts failed:', error);
  }
}

/**
 * Fetch fire weather data
 * Calculates fire danger indices from current conditions
 */
async function fetchFireWeather() {
  if (!weatherState.current) return;

  const { temperature, humidity, windSpeed, windGust } = weatherState.current;

  // Calculate fire weather indices
  const fireWeather = {
    // Red flag conditions: RH < 15% and wind > 25 mph
    redFlag: humidity < 15 && windSpeed > 25,

    // Fire Weather Index (simplified)
    // Based on temp, humidity, wind
    fwi: calculateFWI(temperature, humidity, windSpeed),

    // Burning Index
    burningIndex: calculateBurningIndex(temperature, humidity, windSpeed),

    // Haines Index (Lower Atmosphere Stability Index)
    // Would need upper air data for accurate calculation
    hainesIndex: estimateHainesIndex(temperature, humidity),

    // Spread Component
    spreadComponent: calculateSpreadComponent(windSpeed, windGust),

    // Overall fire danger level
    dangerLevel: calculateDangerLevel(temperature, humidity, windSpeed),

    // Red flag warnings from alerts
    redFlagWarning: weatherState.alerts.some(a =>
      a.event.toLowerCase().includes('red flag') ||
      a.event.toLowerCase().includes('fire weather')
    )
  };

  weatherState.fireWeather = fireWeather;
}

/**
 * Calculate Fire Weather Index (simplified version)
 */
function calculateFWI(temp, rh, wind) {
  if (temp === null || rh === null || wind === null) return null;

  // Simplified FWI calculation
  // Real FWI uses Fine Fuel Moisture Code, Duff Moisture Code, etc.
  const tempFactor = Math.max(0, (temp - 50) / 50);
  const rhFactor = Math.max(0, (100 - rh) / 100);
  const windFactor = Math.min(1, wind / 30);

  return Math.round((tempFactor * 0.3 + rhFactor * 0.4 + windFactor * 0.3) * 100);
}

/**
 * Calculate Burning Index
 */
function calculateBurningIndex(temp, rh, wind) {
  if (temp === null || rh === null || wind === null) return null;

  // Simplified BI calculation
  const spreadComponent = calculateSpreadComponent(wind, wind);
  const energyRelease = Math.max(0, 100 - rh);

  return Math.round(Math.sqrt(spreadComponent * energyRelease));
}

/**
 * Estimate Haines Index (without upper air data)
 */
function estimateHainesIndex(temp, rh) {
  if (temp === null || rh === null) return null;

  // Very rough estimate
  // Real Haines needs 850mb and 700mb temps
  const dewpointDepression = temp - (temp - ((100 - rh) / 5));

  let stabilityTerm = 1;
  if (temp > 80) stabilityTerm = 2;
  if (temp > 90) stabilityTerm = 3;

  let moistureTerm = 1;
  if (dewpointDepression > 10) moistureTerm = 2;
  if (dewpointDepression > 18) moistureTerm = 3;

  return stabilityTerm + moistureTerm;
}

/**
 * Calculate Spread Component
 */
function calculateSpreadComponent(wind, gust) {
  if (wind === null) return 0;
  const effectiveWind = gust ? (wind + gust) / 2 : wind;
  return Math.round(effectiveWind * 2);
}

/**
 * Calculate overall fire danger level
 */
function calculateDangerLevel(temp, rh, wind) {
  if (temp === null || rh === null || wind === null) {
    return { level: 'unknown', color: '#888888' };
  }

  // Scoring
  let score = 0;

  // Temperature factor
  if (temp > 70) score += 1;
  if (temp > 80) score += 1;
  if (temp > 90) score += 2;
  if (temp > 100) score += 2;

  // Humidity factor (inverse)
  if (rh < 50) score += 1;
  if (rh < 30) score += 1;
  if (rh < 20) score += 2;
  if (rh < 15) score += 2;

  // Wind factor
  if (wind > 10) score += 1;
  if (wind > 20) score += 1;
  if (wind > 30) score += 2;
  if (wind > 40) score += 2;

  // Determine level
  if (score >= 10) return { level: 'extreme', color: '#8B0000', label: 'EXTREME' };
  if (score >= 7) return { level: 'very_high', color: '#FF4500', label: 'VERY HIGH' };
  if (score >= 5) return { level: 'high', color: '#FF8C00', label: 'HIGH' };
  if (score >= 3) return { level: 'moderate', color: '#FFD700', label: 'MODERATE' };
  return { level: 'low', color: '#228B22', label: 'LOW' };
}

// Unit conversions
function celsiusToFahrenheit(c) {
  return c !== null ? Math.round(c * 9/5 + 32) : null;
}

function kphToMph(kph) {
  return kph !== null ? Math.round(kph * 0.621371) : null;
}

function metersToMiles(m) {
  return m !== null ? Math.round(m * 0.000621371 * 10) / 10 : null;
}

// Listener management
function onWeatherUpdate(callback) {
  weatherState.listeners.push(callback);
  return () => {
    const idx = weatherState.listeners.indexOf(callback);
    if (idx > -1) weatherState.listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  weatherState.listeners.forEach(cb => {
    try {
      cb(weatherState);
    } catch (e) {
      console.error('[Weather] Listener error:', e);
    }
  });

  window.dispatchEvent(new CustomEvent('weatherupdate', { detail: weatherState }));
}

// Get current weather state
function getWeather() {
  return { ...weatherState };
}

// Get fire weather specifically
function getFireWeather() {
  return weatherState.fireWeather;
}

// Get active alerts
function getAlerts() {
  return [...weatherState.alerts];
}

// Check for critical fire weather conditions
function hasFireWeatherWarning() {
  return weatherState.fireWeather?.redFlagWarning || weatherState.fireWeather?.redFlag;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initWeather,
    refreshWeather,
    getWeather,
    getFireWeather,
    getAlerts,
    hasFireWeatherWarning,
    onWeatherUpdate
  };
}
