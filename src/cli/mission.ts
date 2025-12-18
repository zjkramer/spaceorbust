/**
 * Mission Operations Display
 *
 * Real mission planning. Real orbital mechanics.
 * This isn't just a game UI - it's actual mission ops software.
 */

import {
  hohmannTransfer,
  calculateMission,
  formatDeltaV,
  formatTransferTime,
  MU,
  RADIUS,
  ORBITS,
  ISP,
  propellantMass,
  rocketEquation,
  circularVelocity,
} from '../physics/orbital';

// ============================================
// Display Functions
// ============================================

/**
 * Render mission planner
 */
export function renderMissionPlanner(): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║              MISSION OPERATIONS CENTER                   ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push('  COMMANDS:');
  lines.push('    mission plan <from> <to>    Calculate mission delta-v');
  lines.push('    mission hohmann <r1> <r2>   Hohmann transfer calculation');
  lines.push('    mission fuel <dv> <isp> <payload>  Propellant calculator');
  lines.push('    mission bodies              List celestial body data');
  lines.push('');
  lines.push('  EXAMPLES:');
  lines.push('    mission plan earth_surface mars_surface');
  lines.push('    mission hohmann 6571 42164          # LEO to GEO');
  lines.push('    mission fuel 4.3 363 10000          # Mars mission, Methalox');
  lines.push('');
  lines.push('  DESTINATIONS:');
  lines.push('    leo, geo, moon_orbit, moon_surface,');
  lines.push('    mars_orbit, mars_surface, venus, jupiter');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render mission calculation result
 */
export function renderMissionPlan(
  from: string,
  to: string,
  result: { totalDeltaV: number; stages: Array<{ description: string; deltaV: number }> }
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║                    MISSION PROFILE                       ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`  FROM: ${from.toUpperCase().replace('_', ' ')}`);
  lines.push(`  TO:   ${to.toUpperCase().replace('_', ' ')}`);
  lines.push('');
  lines.push('  ─────────────────────────────────────────────────');
  lines.push('  MANEUVER SEQUENCE:');
  lines.push('  ─────────────────────────────────────────────────');

  let cumulative = 0;
  for (let i = 0; i < result.stages.length; i++) {
    const stage = result.stages[i];
    cumulative += stage.deltaV;
    lines.push(`  ${i + 1}. ${stage.description}`);
    lines.push(`     Δv: ${formatDeltaV(stage.deltaV)}  |  Cumulative: ${formatDeltaV(cumulative)}`);
    lines.push('');
  }

  lines.push('  ─────────────────────────────────────────────────');
  lines.push(`  TOTAL Δv REQUIRED: ${formatDeltaV(result.totalDeltaV)}`);
  lines.push('  ─────────────────────────────────────────────────');
  lines.push('');

  // Propellant requirements for different engines
  const payload = 10000; // 10 ton payload
  lines.push(`  PROPELLANT REQUIREMENTS (${payload} kg payload):`);
  lines.push('');
  lines.push(`    Chemical (Methalox, Isp=${ISP.METHALOX}s):`);
  lines.push(`      Propellant: ${Math.round(propellantMass(result.totalDeltaV, ISP.METHALOX, payload)).toLocaleString()} kg`);
  lines.push('');
  lines.push(`    Chemical (Hydrolox, Isp=${ISP.HYDROLOX}s):`);
  lines.push(`      Propellant: ${Math.round(propellantMass(result.totalDeltaV, ISP.HYDROLOX, payload)).toLocaleString()} kg`);
  lines.push('');
  lines.push(`    Nuclear Thermal (Isp=${ISP.NTR}s):`);
  lines.push(`      Propellant: ${Math.round(propellantMass(result.totalDeltaV, ISP.NTR, payload)).toLocaleString()} kg`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Render Hohmann transfer calculation
 */
export function renderHohmannTransfer(r1: number, r2: number, mu: number = MU.EARTH): string {
  const transfer = hohmannTransfer(r1, r2, mu);
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║                 HOHMANN TRANSFER                         ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`  INITIAL ORBIT:   ${r1.toLocaleString()} km (altitude: ${(r1 - RADIUS.EARTH).toLocaleString()} km)`);
  lines.push(`  FINAL ORBIT:     ${r2.toLocaleString()} km (altitude: ${(r2 - RADIUS.EARTH).toLocaleString()} km)`);
  lines.push('');
  lines.push('  TRANSFER ORBIT:');
  lines.push(`    Semi-major axis: ${transfer.transferOrbit.a.toLocaleString()} km`);
  lines.push(`    Eccentricity:    ${transfer.transferOrbit.e.toFixed(4)}`);
  lines.push('');
  lines.push('  MANEUVERS:');
  lines.push(`    1. Departure:  ${formatDeltaV(transfer.departureBurn.deltaV)}`);
  lines.push(`       ${transfer.departureBurn.description}`);
  lines.push('');
  lines.push(`    2. Arrival:    ${formatDeltaV(transfer.arrivalBurn.deltaV)}`);
  lines.push(`       ${transfer.arrivalBurn.description}`);
  lines.push('');
  lines.push('  ─────────────────────────────────────────────────');
  lines.push(`  TOTAL Δv:         ${formatDeltaV(transfer.totalDeltaV)}`);
  lines.push(`  TRANSFER TIME:    ${formatTransferTime(transfer.transferTime)}`);
  lines.push('  ─────────────────────────────────────────────────');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render propellant calculator
 */
export function renderPropellantCalc(
  deltaV: number,
  isp: number,
  payload: number
): string {
  const propellant = propellantMass(deltaV, isp, payload);
  const massRatio = Math.exp((deltaV * 1000) / (isp * 9.80665));
  const totalMass = payload + propellant;

  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║                PROPELLANT CALCULATOR                     ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`  INPUTS:`);
  lines.push(`    Delta-v required:  ${formatDeltaV(deltaV)}`);
  lines.push(`    Specific impulse:  ${isp} seconds`);
  lines.push(`    Payload mass:      ${payload.toLocaleString()} kg`);
  lines.push('');
  lines.push('  RESULTS:');
  lines.push(`    Mass ratio:        ${massRatio.toFixed(2)}:1`);
  lines.push(`    Propellant mass:   ${Math.round(propellant).toLocaleString()} kg`);
  lines.push(`    Total wet mass:    ${Math.round(totalMass).toLocaleString()} kg`);
  lines.push(`    Propellant %:      ${((propellant / totalMass) * 100).toFixed(1)}%`);
  lines.push('');

  // What delta-v can you get with other payloads?
  lines.push('  ALTERNATIVE PAYLOADS:');
  const altPayloads = [1000, 5000, 20000, 50000];
  for (const p of altPayloads) {
    if (p !== payload) {
      const prop = propellantMass(deltaV, isp, p);
      lines.push(`    ${p.toLocaleString()} kg payload → ${Math.round(prop).toLocaleString()} kg propellant`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * Render celestial body data
 */
export function renderBodies(): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║                 CELESTIAL BODIES                         ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push('  BODY         RADIUS (km)    μ (km³/s²)        v_circ (LEO)');
  lines.push('  ─────────────────────────────────────────────────────────────');

  const bodies = [
    { name: 'Sun', radius: RADIUS.SUN, mu: MU.SUN },
    { name: 'Earth', radius: RADIUS.EARTH, mu: MU.EARTH },
    { name: 'Moon', radius: RADIUS.MOON, mu: MU.MOON },
    { name: 'Mars', radius: RADIUS.MARS, mu: MU.MARS },
    { name: 'Venus', radius: RADIUS.VENUS, mu: MU.VENUS },
    { name: 'Jupiter', radius: RADIUS.JUPITER, mu: MU.JUPITER },
    { name: 'Saturn', radius: RADIUS.SATURN, mu: MU.SATURN },
    { name: 'Ceres', radius: RADIUS.CERES, mu: MU.CERES },
  ];

  for (const body of bodies) {
    const leo = body.radius + 200;
    const vCirc = circularVelocity(leo, body.mu);
    lines.push(
      `  ${body.name.padEnd(12)} ${body.radius.toLocaleString().padStart(10)}    ${body.mu.toExponential(4).padStart(12)}    ${formatDeltaV(vCirc).padStart(10)}`
    );
  }

  lines.push('');
  lines.push('  STANDARD ORBITS:');
  lines.push(`    LEO (Earth):      ${ORBITS.LEO.toLocaleString()} km (200 km altitude)`);
  lines.push(`    GEO (Earth):      ${ORBITS.GEO.toLocaleString()} km`);
  lines.push(`    Lunar distance:   ${ORBITS.LUNAR.toLocaleString()} km`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Render engine comparison
 */
export function renderEngines(): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║                  ENGINE REFERENCE                        ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push('  CHEMICAL PROPULSION:');
  lines.push(`    Solid Rocket:     ${ISP.SOLID_ROCKET} s    (SRB, Castor)`);
  lines.push(`    Kerolox:          ${ISP.KEROLOX} s    (Merlin, RD-180)`);
  lines.push(`    Methalox:         ${ISP.METHALOX} s    (Raptor, BE-4)`);
  lines.push(`    Hydrolox:         ${ISP.HYDROLOX} s    (RS-25, J-2, RL-10)`);
  lines.push('');
  lines.push('  ELECTRIC PROPULSION:');
  lines.push(`    Hall Thruster:    ${ISP.ION_HALL} s    (SPT-100, X3)`);
  lines.push(`    Gridded Ion:      ${ISP.ION_GRIDDED} s    (Dawn, NEXT)`);
  lines.push(`    VASIMR:           ${ISP.VASIMR} s    (Experimental)`);
  lines.push('');
  lines.push('  ADVANCED PROPULSION:');
  lines.push(`    Nuclear Thermal:  ${ISP.NTR} s    (NERVA, DRACO)`);
  lines.push(`    Nuclear Pulse:    ${ISP.NUCLEAR_PULSE} s    (Orion concept)`);
  lines.push('');
  lines.push('  NOTE: Higher Isp = more efficient = less propellant');
  lines.push('        But: Electric = low thrust, Nuclear = heavy');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render hackathon list
 */
export function renderHackathonList(
  challenges: Array<{
    id: string;
    title: string;
    tier: string;
    domain: string;
    status: string;
    rewards: { energy: number; materials: number; data: number };
  }>
): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push('  ║                   ACTIVE HACKATHONS                      ║');
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');

  const open = challenges.filter(c => c.status === 'open');
  const active = challenges.filter(c => c.status === 'active');

  if (open.length > 0) {
    lines.push('  OPEN FOR REGISTRATION:');
    lines.push('  ─────────────────────────────────────────────────');
    for (const c of open) {
      lines.push(`    [${c.tier.toUpperCase().padEnd(12)}] ${c.title}`);
      lines.push(`     Domain: ${c.domain} | Rewards: ${c.rewards.energy}⚡ ${c.rewards.materials}kg ${c.rewards.data}TB`);
      lines.push(`     ID: ${c.id}`);
      lines.push('');
    }
  }

  if (active.length > 0) {
    lines.push('  IN PROGRESS:');
    lines.push('  ─────────────────────────────────────────────────');
    for (const c of active) {
      lines.push(`    [${c.tier.toUpperCase().padEnd(12)}] ${c.title}`);
      lines.push(`     Domain: ${c.domain}`);
      lines.push('');
    }
  }

  if (open.length === 0 && active.length === 0) {
    lines.push('  No active hackathons at this time.');
    lines.push('  Check back soon or propose one!');
  }

  lines.push('');
  lines.push('  COMMANDS:');
  lines.push('    hackathon info <id>     View challenge details');
  lines.push('    hackathon join <id>     Register for challenge');
  lines.push('    hackathon submit <id>   Submit your solution');
  lines.push('');

  return lines.join('\n');
}

/**
 * Render hackathon detail
 */
export function renderHackathonDetail(challenge: {
  id: string;
  title: string;
  description: string;
  tier: string;
  domain: string;
  requirements: string[];
  constraints: string[];
  rewards: { energy: number; materials: number; data: number; badges: string[]; merchCredit?: number; realPrize?: string };
  startDate: string;
  endDate: string;
  judgingCriteria: Array<{ name: string; weight: number; description: string }>;
}): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('  ╔══════════════════════════════════════════════════════════╗');
  lines.push(`  ║  ${challenge.title.substring(0, 54).padEnd(54)}  ║`);
  lines.push('  ╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`  TIER:   ${challenge.tier.toUpperCase()}`);
  lines.push(`  DOMAIN: ${challenge.domain}`);
  lines.push(`  DATES:  ${challenge.startDate} → ${challenge.endDate}`);
  lines.push('');
  lines.push('  DESCRIPTION:');
  lines.push(`  ${challenge.description}`);
  lines.push('');
  lines.push('  REQUIREMENTS:');
  for (const req of challenge.requirements) {
    lines.push(`    • ${req}`);
  }
  lines.push('');
  lines.push('  CONSTRAINTS:');
  for (const con of challenge.constraints) {
    lines.push(`    • ${con}`);
  }
  lines.push('');
  lines.push('  JUDGING CRITERIA:');
  for (const crit of challenge.judgingCriteria) {
    lines.push(`    ${crit.name} (${crit.weight}%): ${crit.description}`);
  }
  lines.push('');
  lines.push('  REWARDS:');
  lines.push(`    Energy:    ${challenge.rewards.energy}⚡`);
  lines.push(`    Materials: ${challenge.rewards.materials} kg`);
  lines.push(`    Data:      ${challenge.rewards.data} TB`);
  if (challenge.rewards.badges.length > 0) {
    lines.push(`    Badges:    ${challenge.rewards.badges.join(', ')}`);
  }
  if (challenge.rewards.merchCredit) {
    lines.push(`    Merch:     $${(challenge.rewards.merchCredit / 100).toFixed(2)} store credit`);
  }
  if (challenge.rewards.realPrize) {
    lines.push(`    Prize:     ${challenge.rewards.realPrize}`);
  }
  lines.push('');
  lines.push('  ─────────────────────────────────────────────────');
  lines.push(`  To join: hackathon join ${challenge.id}`);
  lines.push('');

  return lines.join('\n');
}
