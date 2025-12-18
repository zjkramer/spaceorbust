/**
 * Orbital Mechanics Module
 *
 * Real physics. Real math. No shortcuts.
 * This powers both the game AND serves as actual orbital mechanics software.
 *
 * Based on:
 * - Fundamentals of Astrodynamics (Bate, Mueller, White)
 * - Orbital Mechanics for Engineering Students (Curtis)
 * - NASA trajectory design documents
 */

// ============================================
// Physical Constants
// ============================================

/**
 * Gravitational parameter (μ = GM) in km³/s²
 */
export const MU = {
  SUN: 1.32712440018e11,
  EARTH: 398600.4418,
  MOON: 4902.8,
  MARS: 42828.37,
  VENUS: 324859,
  JUPITER: 126686534,
  SATURN: 37931187,
  CERES: 62.6284,
};

/**
 * Body radii in km
 */
export const RADIUS = {
  SUN: 696340,
  EARTH: 6371,
  MOON: 1737.4,
  MARS: 3389.5,
  VENUS: 6051.8,
  JUPITER: 69911,
  SATURN: 58232,
  CERES: 473,
};

/**
 * Standard orbits - semi-major axis in km
 */
export const ORBITS = {
  LEO: 6571,           // 200km altitude
  GEO: 42164,          // Geostationary
  LUNAR: 384400,       // Earth-Moon distance
  MARS_ORBIT: 227939200,  // Mars semi-major axis around Sun
  EARTH_ORBIT: 149598023, // Earth semi-major axis around Sun
};

/**
 * Standard gravitational acceleration (m/s²)
 */
export const G0 = 9.80665;

// ============================================
// Core Types
// ============================================

/**
 * State vector: position and velocity
 */
export interface StateVector {
  position: Vector3;  // km
  velocity: Vector3;  // km/s
}

/**
 * 3D vector
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Keplerian orbital elements
 */
export interface OrbitalElements {
  a: number;      // Semi-major axis (km)
  e: number;      // Eccentricity (0-1 for ellipse, >1 for hyperbola)
  i: number;      // Inclination (radians)
  raan: number;   // Right ascension of ascending node (radians)
  argp: number;   // Argument of periapsis (radians)
  nu: number;     // True anomaly (radians)
}

/**
 * Maneuver result
 */
export interface Maneuver {
  deltaV: number;         // Total delta-v (km/s)
  burnVector: Vector3;    // Direction and magnitude
  duration?: number;      // Burn duration at given thrust
  timing?: number;        // Time from epoch
  description: string;
}

/**
 * Transfer orbit result
 */
export interface TransferOrbit {
  totalDeltaV: number;
  departureBurn: Maneuver;
  arrivalBurn: Maneuver;
  transferTime: number;   // Seconds
  transferOrbit: OrbitalElements;
}

// ============================================
// Vector Math
// ============================================

export function vecAdd(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vecSub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vecScale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vecDot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vecCross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function vecMag(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function vecNorm(v: Vector3): Vector3 {
  const mag = vecMag(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return vecScale(v, 1 / mag);
}

// ============================================
// Orbital Mechanics Fundamentals
// ============================================

/**
 * Calculate orbital velocity at a given radius
 * v = sqrt(μ * (2/r - 1/a))
 */
export function orbitalVelocity(r: number, a: number, mu: number): number {
  return Math.sqrt(mu * (2 / r - 1 / a));
}

/**
 * Calculate circular orbital velocity
 * v = sqrt(μ/r)
 */
export function circularVelocity(r: number, mu: number): number {
  return Math.sqrt(mu / r);
}

/**
 * Calculate escape velocity
 * v = sqrt(2μ/r)
 */
export function escapeVelocity(r: number, mu: number): number {
  return Math.sqrt(2 * mu / r);
}

/**
 * Calculate orbital period
 * T = 2π * sqrt(a³/μ)
 */
export function orbitalPeriod(a: number, mu: number): number {
  return 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
}

/**
 * Calculate specific orbital energy
 * ε = v²/2 - μ/r = -μ/(2a)
 */
export function specificEnergy(v: number, r: number, mu: number): number {
  return (v * v) / 2 - mu / r;
}

/**
 * Calculate semi-major axis from energy
 * a = -μ/(2ε)
 */
export function semiMajorAxisFromEnergy(epsilon: number, mu: number): number {
  return -mu / (2 * epsilon);
}

/**
 * Calculate periapsis and apoapsis from orbital elements
 */
export function apsides(a: number, e: number): { periapsis: number; apoapsis: number } {
  return {
    periapsis: a * (1 - e),
    apoapsis: a * (1 + e),
  };
}

// ============================================
// Hohmann Transfer
// ============================================

/**
 * Calculate Hohmann transfer between two circular orbits
 * The most energy-efficient two-impulse transfer
 */
export function hohmannTransfer(
  r1: number,     // Initial orbit radius (km)
  r2: number,     // Final orbit radius (km)
  mu: number      // Gravitational parameter
): TransferOrbit {
  // Transfer orbit semi-major axis
  const aTransfer = (r1 + r2) / 2;

  // Velocities in initial orbit
  const v1 = circularVelocity(r1, mu);

  // Velocity at periapsis of transfer orbit
  const vTransferPeri = orbitalVelocity(r1, aTransfer, mu);

  // First burn (departure)
  const deltaV1 = vTransferPeri - v1;

  // Velocities at final orbit
  const v2 = circularVelocity(r2, mu);

  // Velocity at apoapsis of transfer orbit
  const vTransferApo = orbitalVelocity(r2, aTransfer, mu);

  // Second burn (arrival)
  const deltaV2 = v2 - vTransferApo;

  // Transfer time (half the period of transfer orbit)
  const transferTime = orbitalPeriod(aTransfer, mu) / 2;

  // Eccentricity of transfer orbit
  const eTransfer = (r2 - r1) / (r2 + r1);

  return {
    totalDeltaV: Math.abs(deltaV1) + Math.abs(deltaV2),
    departureBurn: {
      deltaV: Math.abs(deltaV1),
      burnVector: { x: deltaV1, y: 0, z: 0 }, // Prograde
      description: deltaV1 > 0 ? 'Prograde burn to raise apoapsis' : 'Retrograde burn to lower apoapsis',
    },
    arrivalBurn: {
      deltaV: Math.abs(deltaV2),
      burnVector: { x: deltaV2, y: 0, z: 0 },
      description: deltaV2 > 0 ? 'Prograde burn to circularize' : 'Retrograde burn to circularize',
    },
    transferTime,
    transferOrbit: {
      a: aTransfer,
      e: eTransfer,
      i: 0,
      raan: 0,
      argp: 0,
      nu: 0,
    },
  };
}

// ============================================
// Bi-Elliptic Transfer
// ============================================

/**
 * Calculate bi-elliptic transfer
 * More efficient than Hohmann for large radius ratios (> 11.94)
 */
export function biEllipticTransfer(
  r1: number,     // Initial orbit radius
  r2: number,     // Final orbit radius
  rb: number,     // Intermediate apoapsis radius
  mu: number
): TransferOrbit & { intermediateBurn: Maneuver } {
  // First transfer ellipse
  const a1 = (r1 + rb) / 2;
  const v1 = circularVelocity(r1, mu);
  const vT1Peri = orbitalVelocity(r1, a1, mu);
  const deltaV1 = vT1Peri - v1;

  // At intermediate apoapsis
  const vT1Apo = orbitalVelocity(rb, a1, mu);

  // Second transfer ellipse
  const a2 = (rb + r2) / 2;
  const vT2Apo = orbitalVelocity(rb, a2, mu);
  const deltaV2 = vT2Apo - vT1Apo;

  // At final orbit
  const vT2Peri = orbitalVelocity(r2, a2, mu);
  const v2 = circularVelocity(r2, mu);
  const deltaV3 = v2 - vT2Peri;

  // Transfer times
  const t1 = orbitalPeriod(a1, mu) / 2;
  const t2 = orbitalPeriod(a2, mu) / 2;

  return {
    totalDeltaV: Math.abs(deltaV1) + Math.abs(deltaV2) + Math.abs(deltaV3),
    departureBurn: {
      deltaV: Math.abs(deltaV1),
      burnVector: { x: deltaV1, y: 0, z: 0 },
      description: 'Initial prograde burn',
    },
    intermediateBurn: {
      deltaV: Math.abs(deltaV2),
      burnVector: { x: deltaV2, y: 0, z: 0 },
      timing: t1,
      description: 'Intermediate burn at apoapsis',
    },
    arrivalBurn: {
      deltaV: Math.abs(deltaV3),
      burnVector: { x: deltaV3, y: 0, z: 0 },
      timing: t1 + t2,
      description: 'Circularization burn',
    },
    transferTime: t1 + t2,
    transferOrbit: {
      a: a1,
      e: (rb - r1) / (rb + r1),
      i: 0,
      raan: 0,
      argp: 0,
      nu: 0,
    },
  };
}

// ============================================
// Plane Change
// ============================================

/**
 * Calculate delta-v for pure inclination change
 * Most efficient at apoapsis or when velocity is lowest
 */
export function planeChange(
  v: number,        // Orbital velocity at maneuver point
  deltaI: number    // Inclination change (radians)
): Maneuver {
  // Delta-v for plane change: Δv = 2v*sin(Δi/2)
  const deltaV = 2 * v * Math.sin(deltaI / 2);

  return {
    deltaV,
    burnVector: { x: 0, y: 0, z: deltaV },
    description: `Plane change of ${(deltaI * 180 / Math.PI).toFixed(2)}°`,
  };
}

/**
 * Combined plane change with Hohmann transfer
 * Optimal to do plane change at one of the burn points
 */
export function combinedTransfer(
  r1: number,
  r2: number,
  deltaI: number,   // Inclination change (radians)
  mu: number
): TransferOrbit {
  const hohmann = hohmannTransfer(r1, r2, mu);

  // Plane change is most efficient at apoapsis (slower velocity)
  // Combine with second burn
  const vAtR2 = orbitalVelocity(r2, (r1 + r2) / 2, mu);
  const v2Final = circularVelocity(r2, mu);

  // Vector addition of circularization and plane change
  const deltaVCirc = v2Final - vAtR2;
  const deltaVPlane = 2 * vAtR2 * Math.sin(deltaI / 2);

  // Combined delta-v (law of cosines)
  const combinedDeltaV = Math.sqrt(
    deltaVCirc * deltaVCirc +
    deltaVPlane * deltaVPlane +
    2 * deltaVCirc * deltaVPlane * Math.cos(Math.PI / 2 + deltaI / 2)
  );

  return {
    totalDeltaV: Math.abs(hohmann.departureBurn.deltaV) + combinedDeltaV,
    departureBurn: hohmann.departureBurn,
    arrivalBurn: {
      deltaV: combinedDeltaV,
      burnVector: { x: deltaVCirc, y: 0, z: deltaVPlane },
      description: `Combined circularization and ${(deltaI * 180 / Math.PI).toFixed(2)}° plane change`,
    },
    transferTime: hohmann.transferTime,
    transferOrbit: hohmann.transferOrbit,
  };
}

// ============================================
// Gravity Assist (Simplified)
// ============================================

/**
 * Calculate maximum delta-v from gravity assist
 * Simplified model - assumes optimal geometry
 */
export function gravityAssist(
  vInfinity: number,  // Hyperbolic excess velocity
  rPeriapsis: number, // Periapsis radius during flyby
  muBody: number      // Gravitational parameter of body
): { maxDeltaV: number; turningAngle: number } {
  // Semi-major axis of hyperbola (negative)
  const a = -muBody / (vInfinity * vInfinity);

  // Eccentricity
  const e = 1 - rPeriapsis / a;

  // Turning angle (half angle)
  const delta = Math.asin(1 / e);

  // Maximum delta-v (change in direction only)
  const maxDeltaV = 2 * vInfinity * Math.sin(delta);

  return {
    maxDeltaV,
    turningAngle: 2 * delta,
  };
}

// ============================================
// Common Mission Delta-V
// ============================================

/**
 * Pre-calculated delta-v budgets for common missions
 * All values in km/s
 */
export const DELTA_V_BUDGET = {
  // From Earth surface
  LEO: 9.4,                    // To 200km LEO
  GEO_DIRECT: 13.8,            // Direct to GEO
  EARTH_ESCAPE: 11.2,          // C3 = 0

  // From LEO
  LEO_TO_GEO: 3.9,
  LEO_TO_MOON_TRANSFER: 3.1,
  LEO_TO_MOON_CAPTURE: 0.8,    // Lunar orbit insertion
  LEO_TO_MARS_TRANSFER: 3.6,
  LEO_TO_MARS_CAPTURE: 1.0,    // Mars orbit insertion

  // From lunar surface
  MOON_TO_LLO: 1.9,            // To low lunar orbit
  MOON_TO_EARTH: 2.7,          // Return trajectory

  // From Mars surface
  MARS_TO_LMO: 4.1,            // To low Mars orbit
  MARS_TO_EARTH: 5.7,          // Return trajectory

  // Interplanetary (from LEO, including capture)
  TO_VENUS: 3.5,
  TO_MARS: 4.3,
  TO_JUPITER: 6.3,
  TO_SATURN: 7.3,
  TO_CERES: 4.9,
};

// ============================================
// Rocket Equation
// ============================================

/**
 * Tsiolkovsky rocket equation
 * Δv = Isp * g0 * ln(m0/mf)
 */
export function rocketEquation(
  isp: number,      // Specific impulse (seconds)
  m0: number,       // Initial mass (kg)
  mf: number        // Final mass (kg)
): number {
  return isp * G0 * Math.log(m0 / mf) / 1000; // Convert to km/s
}

/**
 * Calculate required mass ratio for given delta-v
 */
export function requiredMassRatio(
  deltaV: number,   // km/s
  isp: number       // seconds
): number {
  return Math.exp((deltaV * 1000) / (isp * G0));
}

/**
 * Calculate propellant mass needed
 */
export function propellantMass(
  deltaV: number,   // km/s
  isp: number,      // seconds
  payload: number   // payload mass (kg)
): number {
  const massRatio = requiredMassRatio(deltaV, isp);
  // m0 = mf * massRatio, propellant = m0 - mf
  // mf = payload + structure, assume structure = 10% of propellant
  // Simplified: mf ≈ payload, propellant = payload * (massRatio - 1)
  return payload * (massRatio - 1);
}

// ============================================
// Common Engine ISP Values (seconds)
// ============================================

export const ISP = {
  // Chemical
  SOLID_ROCKET: 250,
  KEROLOX: 311,         // RP-1/LOX (Merlin)
  HYDROLOX: 450,        // LH2/LOX (RS-25)
  METHALOX: 363,        // CH4/LOX (Raptor)

  // Electric
  ION_HALL: 1500,       // Hall thruster
  ION_GRIDDED: 3000,    // Gridded ion (Dawn)
  VASIMR: 5000,         // Variable ISP

  // Nuclear
  NTR: 900,             // Nuclear thermal
  NUCLEAR_PULSE: 10000, // Orion-style
};

// ============================================
// Utility Functions
// ============================================

/**
 * Convert km/s to m/s
 */
export function kmsToMs(v: number): number {
  return v * 1000;
}

/**
 * Convert degrees to radians
 */
export function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

/**
 * Format delta-v for display
 */
export function formatDeltaV(dv: number): string {
  if (dv >= 1) {
    return `${dv.toFixed(2)} km/s`;
  }
  return `${(dv * 1000).toFixed(0)} m/s`;
}

/**
 * Format time for display
 */
export function formatTransferTime(seconds: number): string {
  const days = seconds / 86400;
  if (days >= 365) {
    return `${(days / 365).toFixed(1)} years`;
  }
  if (days >= 30) {
    return `${(days / 30).toFixed(1)} months`;
  }
  if (days >= 1) {
    return `${days.toFixed(1)} days`;
  }
  return `${(seconds / 3600).toFixed(1)} hours`;
}

// ============================================
// Mission Calculator
// ============================================

/**
 * Calculate mission delta-v budget
 */
export function calculateMission(
  from: 'earth_surface' | 'leo' | 'moon_surface' | 'mars_surface',
  to: 'leo' | 'geo' | 'moon_orbit' | 'moon_surface' | 'mars_orbit' | 'mars_surface' | 'venus' | 'jupiter'
): { totalDeltaV: number; stages: Array<{ description: string; deltaV: number }> } {
  const stages: Array<{ description: string; deltaV: number }> = [];
  let total = 0;

  if (from === 'earth_surface') {
    stages.push({ description: 'Launch to LEO', deltaV: DELTA_V_BUDGET.LEO });
    total += DELTA_V_BUDGET.LEO;

    if (to === 'leo') {
      return { totalDeltaV: total, stages };
    }

    // Continue from LEO
    from = 'leo';
  }

  if (from === 'leo') {
    switch (to) {
      case 'geo':
        stages.push({ description: 'LEO to GEO transfer', deltaV: DELTA_V_BUDGET.LEO_TO_GEO });
        total += DELTA_V_BUDGET.LEO_TO_GEO;
        break;
      case 'moon_orbit':
        stages.push({ description: 'Trans-lunar injection', deltaV: DELTA_V_BUDGET.LEO_TO_MOON_TRANSFER });
        stages.push({ description: 'Lunar orbit insertion', deltaV: DELTA_V_BUDGET.LEO_TO_MOON_CAPTURE });
        total += DELTA_V_BUDGET.LEO_TO_MOON_TRANSFER + DELTA_V_BUDGET.LEO_TO_MOON_CAPTURE;
        break;
      case 'moon_surface':
        stages.push({ description: 'Trans-lunar injection', deltaV: DELTA_V_BUDGET.LEO_TO_MOON_TRANSFER });
        stages.push({ description: 'Lunar orbit insertion', deltaV: DELTA_V_BUDGET.LEO_TO_MOON_CAPTURE });
        stages.push({ description: 'Lunar descent', deltaV: DELTA_V_BUDGET.MOON_TO_LLO });
        total += DELTA_V_BUDGET.LEO_TO_MOON_TRANSFER + DELTA_V_BUDGET.LEO_TO_MOON_CAPTURE + DELTA_V_BUDGET.MOON_TO_LLO;
        break;
      case 'mars_orbit':
        stages.push({ description: 'Trans-Mars injection', deltaV: DELTA_V_BUDGET.LEO_TO_MARS_TRANSFER });
        stages.push({ description: 'Mars orbit insertion', deltaV: DELTA_V_BUDGET.LEO_TO_MARS_CAPTURE });
        total += DELTA_V_BUDGET.LEO_TO_MARS_TRANSFER + DELTA_V_BUDGET.LEO_TO_MARS_CAPTURE;
        break;
      case 'mars_surface':
        stages.push({ description: 'Trans-Mars injection', deltaV: DELTA_V_BUDGET.LEO_TO_MARS_TRANSFER });
        stages.push({ description: 'Mars orbit insertion', deltaV: DELTA_V_BUDGET.LEO_TO_MARS_CAPTURE });
        stages.push({ description: 'Mars descent', deltaV: DELTA_V_BUDGET.MARS_TO_LMO });
        total += DELTA_V_BUDGET.LEO_TO_MARS_TRANSFER + DELTA_V_BUDGET.LEO_TO_MARS_CAPTURE + DELTA_V_BUDGET.MARS_TO_LMO;
        break;
      case 'venus':
        stages.push({ description: 'Trans-Venus injection + capture', deltaV: DELTA_V_BUDGET.TO_VENUS });
        total += DELTA_V_BUDGET.TO_VENUS;
        break;
      case 'jupiter':
        stages.push({ description: 'Trans-Jupiter injection + capture', deltaV: DELTA_V_BUDGET.TO_JUPITER });
        total += DELTA_V_BUDGET.TO_JUPITER;
        break;
    }
  }

  return { totalDeltaV: total, stages };
}
