/**
 * Weather & Environmental Monitoring
 *
 * Fire weather, general weather, air quality
 * Works Earth → Moon → Mars
 *
 * MIT License - Free forever. Fuck predatory private equity.
 */

import { Position } from './types';

// Fire weather severity
export type FireWeatherLevel =
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'
  | 'extreme'
  | 'red_flag';

// Weather station
export interface WeatherStation {
  id: string;
  name: string;
  position: Position;
  type: 'fixed' | 'mobile' | 'personal' | 'official';
  source?: 'local' | 'nws' | 'cwop' | 'wunderground' | 'davis' | 'ecowitt';
  isActive: boolean;
  lastReportTime?: Date;
  organizationId?: string;
}

// Current weather conditions
export interface WeatherConditions {
  stationId: string;
  timestamp: Date;

  // Temperature
  temperatureC?: number;
  temperatureF?: number;
  feelsLikeC?: number;
  feelsLikeF?: number;
  heatIndex?: number;
  windChill?: number;
  dewPointC?: number;
  dewPointF?: number;

  // Humidity
  relativeHumidity?: number;     // 0-100%

  // Wind
  windSpeedKph?: number;
  windSpeedMph?: number;
  windGustKph?: number;
  windGustMph?: number;
  windDirectionDeg?: number;     // 0-360
  windDirectionCardinal?: string; // "N", "NE", "SW", etc

  // Pressure
  pressureHpa?: number;
  pressureInHg?: number;
  pressureTrend?: 'rising' | 'falling' | 'steady';

  // Precipitation
  precipitationMm?: number;
  precipitationIn?: number;
  precipRateMmHr?: number;
  precipType?: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';

  // Solar
  solarRadiationWm2?: number;
  uvIndex?: number;

  // Visibility
  visibilityKm?: number;
  visibilityMi?: number;

  // Cloud
  cloudCover?: number;           // 0-100%
  cloudCeiling?: number;         // feet AGL

  // Soil/Surface (for wildland fire)
  soilTemperatureC?: number;
  soilMoisture?: number;         // 0-100%

  // Air Quality
  pm25?: number;                 // µg/m³
  pm10?: number;
  aqi?: number;                  // Air Quality Index 0-500
  aqiCategory?: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
}

// Fire weather specific calculations
export interface FireWeatherIndex {
  stationId: string;
  timestamp: Date;

  // Core indices
  fireWeatherIndex: number;      // Overall FWI (0-100+)
  burningIndex: number;          // BI
  spreadComponent: number;       // SC
  energyReleaseComponent: number; // ERC

  // Fuel moisture
  fuelMoisture1Hr?: number;      // Fine fuels
  fuelMoisture10Hr?: number;     // Small fuels
  fuelMoisture100Hr?: number;    // Medium fuels
  fuelMoisture1000Hr?: number;   // Large fuels
  liveFuelMoisture?: number;     // Live vegetation

  // Severity
  level: FireWeatherLevel;

  // Red flag conditions
  isRedFlag: boolean;
  redFlagReasons?: string[];     // "Low humidity (<15%)", "High wind (>25mph)"

  // Spot fire potential
  spotFireProbability?: number;  // 0-100%

  // Calculated from weather
  relativeHumidity: number;
  windSpeedMph: number;
  temperatureF: number;
}

// Weather alert
export interface WeatherAlert {
  id: string;
  type: string;                  // "Red Flag Warning", "Heat Advisory", etc
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  headline: string;
  description: string;
  instruction?: string;
  affectedZones: string[];
  effectiveAt: Date;
  expiresAt: Date;
  source: string;                // "NWS", "local", etc
  isActive: boolean;
}

// Weather forecast
export interface WeatherForecast {
  stationId: string;
  generatedAt: Date;
  periods: WeatherForecastPeriod[];
}

export interface WeatherForecastPeriod {
  name: string;                  // "Tonight", "Wednesday", etc
  startTime: Date;
  endTime: Date;
  isDaytime: boolean;

  // Summary
  shortForecast: string;
  detailedForecast: string;
  icon?: string;

  // Temperature
  temperatureHighF?: number;
  temperatureLowF?: number;
  temperatureF?: number;

  // Wind
  windSpeedMph?: number;
  windDirection?: string;

  // Precipitation
  precipProbability?: number;    // 0-100%

  // Fire weather
  fireWeatherLevel?: FireWeatherLevel;
  redFlagPotential?: boolean;
}

// Calculate fire weather index from conditions
export function calculateFireWeatherIndex(conditions: WeatherConditions): FireWeatherIndex {
  const rh = conditions.relativeHumidity ?? 50;
  const windMph = conditions.windSpeedMph ?? conditions.windSpeedKph ? (conditions.windSpeedKph! * 0.621371) : 0;
  const tempF = conditions.temperatureF ?? (conditions.temperatureC ? conditions.temperatureC * 9/5 + 32 : 70);

  // Simplified FWI calculation (real calculation is much more complex)
  // This is a placeholder - actual implementation needs NFDRS equations
  const drynessComponent = Math.max(0, (100 - rh) / 10);
  const windComponent = Math.min(10, windMph / 5);
  const tempComponent = Math.max(0, (tempF - 60) / 10);

  const fwi = Math.round((drynessComponent * 4 + windComponent * 3 + tempComponent * 3));

  // Determine level
  let level: FireWeatherLevel;
  if (fwi < 20) level = 'low';
  else if (fwi < 40) level = 'moderate';
  else if (fwi < 60) level = 'high';
  else if (fwi < 80) level = 'very_high';
  else if (fwi < 100) level = 'extreme';
  else level = 'red_flag';

  // Check red flag conditions
  const redFlagReasons: string[] = [];
  if (rh < 15) redFlagReasons.push('Humidity below 15%');
  if (windMph > 25) redFlagReasons.push('Sustained wind over 25 mph');
  if (rh < 25 && windMph > 15) redFlagReasons.push('Low humidity + elevated wind');

  const isRedFlag = redFlagReasons.length > 0;
  if (isRedFlag) level = 'red_flag';

  return {
    stationId: conditions.stationId,
    timestamp: conditions.timestamp,
    fireWeatherIndex: fwi,
    burningIndex: Math.round(fwi * 1.5),
    spreadComponent: Math.round(fwi * 0.8),
    energyReleaseComponent: Math.round(fwi * 1.2),
    level,
    isRedFlag,
    redFlagReasons: isRedFlag ? redFlagReasons : undefined,
    relativeHumidity: rh,
    windSpeedMph: windMph,
    temperatureF: tempF,
  };
}

// Format wind direction as cardinal
export function windDirectionToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

// Convert temperatures
export function celsiusToFahrenheit(c: number): number {
  return c * 9/5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return (f - 32) * 5/9;
}

// Calculate heat index
export function calculateHeatIndex(tempF: number, humidity: number): number {
  if (tempF < 80) return tempF;

  const hi = -42.379 +
    2.04901523 * tempF +
    10.14333127 * humidity -
    0.22475541 * tempF * humidity -
    0.00683783 * tempF * tempF -
    0.05481717 * humidity * humidity +
    0.00122874 * tempF * tempF * humidity +
    0.00085282 * tempF * humidity * humidity -
    0.00000199 * tempF * tempF * humidity * humidity;

  return Math.round(hi);
}

// Calculate wind chill
export function calculateWindChill(tempF: number, windMph: number): number {
  if (tempF > 50 || windMph < 3) return tempF;

  const wc = 35.74 +
    0.6215 * tempF -
    35.75 * Math.pow(windMph, 0.16) +
    0.4275 * tempF * Math.pow(windMph, 0.16);

  return Math.round(wc);
}
