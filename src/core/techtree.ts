/**
 * Technology Tree
 *
 * Based on the Critical Path document.
 * Every technology is real. Every dependency is physics.
 */

import { Technology, Resources } from './types';

/**
 * Era 1: Earth-Bound (2024-2050)
 * The foundation. Master these or die trying to skip them.
 */
export const ERA_1_TECHNOLOGIES: Technology[] = [
  // Layer 0: Prerequisites
  {
    id: 'reusable_rockets',
    name: 'Reusable Rockets',
    description: 'Land and refly orbital boosters. 100x cost reduction to orbit.',
    era: 1,
    layer: 0,
    cost: { energy: 500, materials: 300, data: 200, population: 0 },
    prerequisites: [],
    unlocked: true,  // Starting tech
    completed: false,
  },
  {
    id: 'solar_power_mastery',
    name: 'Solar Power Mastery',
    description: 'High-efficiency photovoltaics and grid-scale storage.',
    era: 1,
    layer: 0,
    cost: { energy: 300, materials: 400, data: 150, population: 0 },
    prerequisites: [],
    unlocked: true,
    completed: false,
  },
  {
    id: 'advanced_materials',
    name: 'Advanced Materials',
    description: 'Carbon composites, radiation shielding, thermal protection.',
    era: 1,
    layer: 0,
    cost: { energy: 400, materials: 500, data: 300, population: 0 },
    prerequisites: [],
    unlocked: true,
    completed: false,
  },
  {
    id: 'autonomous_systems',
    name: 'Autonomous Systems',
    description: 'Self-driving vehicles, robotic assembly, remote operations.',
    era: 1,
    layer: 0,
    cost: { energy: 350, materials: 200, data: 500, population: 0 },
    prerequisites: [],
    unlocked: true,
    completed: false,
  },

  // Layer 1: Survival Basics
  {
    id: 'life_support_closed_loop',
    name: 'Closed-Loop Life Support',
    description: 'ECLSS: 93%+ water recovery, CO2 scrubbing, O2 generation.',
    era: 1,
    layer: 1,
    cost: { energy: 600, materials: 400, data: 350, population: 0 },
    prerequisites: ['advanced_materials'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'space_medicine',
    name: 'Space Medicine',
    description: 'Countermeasures for radiation, bone loss, muscle atrophy.',
    era: 1,
    layer: 1,
    cost: { energy: 300, materials: 200, data: 600, population: 0 },
    prerequisites: [],
    unlocked: true,
    completed: false,
  },

  // Layer 2: Food
  {
    id: 'hydroponics',
    name: 'Controlled Environment Agriculture',
    description: 'LED hydroponics, aeroponics, nutrient cycling.',
    era: 1,
    layer: 2,
    cost: { energy: 450, materials: 350, data: 400, population: 0 },
    prerequisites: ['life_support_closed_loop'],
    unlocked: false,
    completed: false,
  },

  // Layer 3: Resources
  {
    id: 'water_extraction',
    name: 'Water Extraction Tech',
    description: 'Thermal mining, ice drilling, atmospheric capture.',
    era: 1,
    layer: 3,
    cost: { energy: 400, materials: 450, data: 300, population: 0 },
    prerequisites: ['autonomous_systems'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'oxygen_production',
    name: 'ISRU Oxygen Production',
    description: 'MOXIE-style CO2 electrolysis, water splitting.',
    era: 1,
    layer: 3,
    cost: { energy: 500, materials: 400, data: 350, population: 0 },
    prerequisites: ['water_extraction'],
    unlocked: false,
    completed: false,
  },

  // Layer 4: Building
  {
    id: 'additive_manufacturing',
    name: 'Space 3D Printing',
    description: 'Print structures from regolith, metal sintering.',
    era: 1,
    layer: 4,
    cost: { energy: 550, materials: 600, data: 400, population: 0 },
    prerequisites: ['advanced_materials', 'autonomous_systems'],
    unlocked: false,
    completed: false,
  },

  // Layer 5: Power
  {
    id: 'space_nuclear_fission',
    name: 'Space Nuclear Fission',
    description: 'Kilopower reactors. Reliable baseload anywhere.',
    era: 1,
    layer: 5,
    cost: { energy: 700, materials: 800, data: 600, population: 0 },
    prerequisites: ['advanced_materials'],
    unlocked: false,
    completed: false,
  },

  // Layer 6: Propulsion
  {
    id: 'ion_propulsion',
    name: 'Ion Propulsion',
    description: 'High-efficiency electric thrusters for deep space.',
    era: 1,
    layer: 6,
    cost: { energy: 450, materials: 350, data: 400, population: 0 },
    prerequisites: ['solar_power_mastery'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'methane_rockets',
    name: 'Methane/LOX Rockets',
    description: 'ISRU-compatible propulsion. Make fuel on Mars.',
    era: 1,
    layer: 6,
    cost: { energy: 600, materials: 500, data: 350, population: 0 },
    prerequisites: ['reusable_rockets', 'oxygen_production'],
    unlocked: false,
    completed: false,
  },

  // Layer 7: Communication
  {
    id: 'deep_space_network',
    name: 'Deep Space Network',
    description: 'Laser comms, relay satellites, delay-tolerant protocols.',
    era: 1,
    layer: 7,
    cost: { energy: 400, materials: 300, data: 500, population: 0 },
    prerequisites: ['autonomous_systems'],
    unlocked: false,
    completed: false,
  },

  // Milestone: LEO Station
  {
    id: 'orbital_station',
    name: 'Orbital Station',
    description: 'Permanent crewed presence in Low Earth Orbit.',
    era: 1,
    layer: 0,
    cost: { energy: 1000, materials: 1200, data: 800, population: 0 },
    prerequisites: ['reusable_rockets', 'life_support_closed_loop'],
    unlocked: false,
    completed: false,
  },

  // Milestone: Moon Landing
  {
    id: 'lunar_landing',
    name: 'Crewed Lunar Landing',
    description: 'Return to the Moon. This time to stay.',
    era: 1,
    layer: 0,
    cost: { energy: 1500, materials: 1800, data: 1000, population: 0 },
    prerequisites: ['orbital_station', 'space_nuclear_fission', 'methane_rockets'],
    unlocked: false,
    completed: false,
  },
];

/**
 * Get all technologies for an era
 */
export function getTechnologiesForEra(era: number): Technology[] {
  if (era === 1) return ERA_1_TECHNOLOGIES;
  // Future: ERA_2, ERA_3, ERA_4
  return [];
}

/**
 * Get a technology by ID
 */
export function getTechnology(id: string): Technology | undefined {
  return ERA_1_TECHNOLOGIES.find(t => t.id === id);
}

/**
 * Check if a technology can be researched
 */
export function canResearch(
  tech: Technology,
  completedTechs: string[],
  resources: Resources
): { canResearch: boolean; reason?: string } {
  // Check if already completed
  if (completedTechs.includes(tech.id)) {
    return { canResearch: false, reason: 'Already completed' };
  }

  // Check prerequisites
  for (const prereq of tech.prerequisites) {
    if (!completedTechs.includes(prereq)) {
      const prereqTech = getTechnology(prereq);
      return {
        canResearch: false,
        reason: `Requires: ${prereqTech?.name || prereq}`,
      };
    }
  }

  // Check resources
  if (resources.energy < tech.cost.energy) {
    return { canResearch: false, reason: `Need ${tech.cost.energy} energy` };
  }
  if (resources.materials < tech.cost.materials) {
    return { canResearch: false, reason: `Need ${tech.cost.materials} materials` };
  }
  if (resources.data < tech.cost.data) {
    return { canResearch: false, reason: `Need ${tech.cost.data} data` };
  }

  return { canResearch: true };
}

/**
 * Get unlocked (researchable) technologies
 */
export function getUnlockedTechnologies(completedTechs: string[]): Technology[] {
  return ERA_1_TECHNOLOGIES.filter(tech => {
    if (completedTechs.includes(tech.id)) return false;
    return tech.prerequisites.every(p => completedTechs.includes(p));
  });
}

/**
 * Calculate research progress percentage
 */
export function getEraProgress(era: number, completedTechs: string[]): number {
  const techs = getTechnologiesForEra(era);
  if (techs.length === 0) return 0;
  const completed = techs.filter(t => completedTechs.includes(t.id)).length;
  return Math.floor((completed / techs.length) * 100);
}
