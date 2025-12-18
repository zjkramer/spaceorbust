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
 * Era 2: Inner Solar System (2050-2150)
 * Moon bases, Mars colonization, asteroid mining.
 * Prerequisite: Complete Era 1 milestone (lunar_landing)
 */
export const ERA_2_TECHNOLOGIES: Technology[] = [
  // Lunar Infrastructure
  {
    id: 'lunar_base',
    name: 'Permanent Lunar Base',
    description: 'Underground habitat in lunar lava tubes. First off-world home.',
    era: 2,
    layer: 0,
    cost: { energy: 3000, materials: 4000, data: 2000, population: 0 },
    prerequisites: ['lunar_landing'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'lunar_mining',
    name: 'Lunar ISRU Mining',
    description: 'Extract water ice from permanently shadowed craters.',
    era: 2,
    layer: 3,
    cost: { energy: 2500, materials: 3500, data: 1500, population: 0 },
    prerequisites: ['lunar_base', 'water_extraction'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'lunar_fuel_depot',
    name: 'Lunar Fuel Depot',
    description: 'Produce and store propellant on the Moon. Gateway to deep space.',
    era: 2,
    layer: 6,
    cost: { energy: 3500, materials: 4500, data: 2000, population: 0 },
    prerequisites: ['lunar_mining', 'oxygen_production'],
    unlocked: false,
    completed: false,
  },

  // Mars Transit
  {
    id: 'mars_transit_vehicle',
    name: 'Mars Transit Vehicle',
    description: 'Reusable spacecraft for Earth-Mars transfers. 6-month journey.',
    era: 2,
    layer: 6,
    cost: { energy: 5000, materials: 6000, data: 3000, population: 0 },
    prerequisites: ['lunar_fuel_depot', 'ion_propulsion'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'artificial_gravity',
    name: 'Artificial Gravity',
    description: 'Rotating sections for long-duration missions. Preserve bone and muscle.',
    era: 2,
    layer: 8,
    cost: { energy: 4000, materials: 5000, data: 3500, population: 0 },
    prerequisites: ['mars_transit_vehicle'],
    unlocked: false,
    completed: false,
  },

  // Mars Surface
  {
    id: 'mars_landing',
    name: 'Crewed Mars Landing',
    description: 'First humans on Mars. The greatest journey.',
    era: 2,
    layer: 0,
    cost: { energy: 8000, materials: 10000, data: 5000, population: 0 },
    prerequisites: ['mars_transit_vehicle', 'artificial_gravity'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'mars_habitat',
    name: 'Mars Surface Habitat',
    description: 'Pressurized living space. Protection from radiation and dust storms.',
    era: 2,
    layer: 0,
    cost: { energy: 6000, materials: 8000, data: 3000, population: 0 },
    prerequisites: ['mars_landing', 'additive_manufacturing'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'mars_isru',
    name: 'Mars ISRU Operations',
    description: 'Produce fuel, oxygen, and water from Martian atmosphere and soil.',
    era: 2,
    layer: 3,
    cost: { energy: 5000, materials: 6000, data: 4000, population: 0 },
    prerequisites: ['mars_habitat', 'oxygen_production'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'mars_greenhouse',
    name: 'Mars Greenhouse',
    description: 'Grow food on Mars. First step to bioregenerative life support.',
    era: 2,
    layer: 2,
    cost: { energy: 4500, materials: 5500, data: 3500, population: 0 },
    prerequisites: ['mars_habitat', 'hydroponics'],
    unlocked: false,
    completed: false,
  },

  // Asteroid Belt
  {
    id: 'asteroid_prospecting',
    name: 'Asteroid Prospecting',
    description: 'Survey and map asteroid belt resources. Trillion-dollar rocks.',
    era: 2,
    layer: 3,
    cost: { energy: 4000, materials: 3000, data: 5000, population: 0 },
    prerequisites: ['deep_space_network', 'ion_propulsion'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'asteroid_mining',
    name: 'Asteroid Mining Operations',
    description: 'Extract metals and volatiles from asteroids. Space-based industry.',
    era: 2,
    layer: 3,
    cost: { energy: 7000, materials: 8000, data: 4000, population: 0 },
    prerequisites: ['asteroid_prospecting', 'autonomous_systems'],
    unlocked: false,
    completed: false,
  },

  // Advanced Systems
  {
    id: 'fusion_research',
    name: 'Fusion Power Research',
    description: 'Working toward net-positive fusion. The ultimate energy source.',
    era: 2,
    layer: 5,
    cost: { energy: 10000, materials: 8000, data: 12000, population: 0 },
    prerequisites: ['space_nuclear_fission'],
    unlocked: false,
    completed: false,
  },
  {
    id: 'genetic_adaptation',
    name: 'Human Genetic Adaptation',
    description: 'Modify humans for space: radiation resistance, bone density.',
    era: 2,
    layer: 8,
    cost: { energy: 6000, materials: 4000, data: 10000, population: 0 },
    prerequisites: ['space_medicine'],
    unlocked: false,
    completed: false,
  },

  // AI Evolution
  {
    id: 'general_ai',
    name: 'General AI',
    description: 'AI that can learn any task. Partners, not just tools.',
    era: 2,
    layer: 7,
    cost: { energy: 8000, materials: 5000, data: 15000, population: 0 },
    prerequisites: ['autonomous_systems', 'deep_space_network'],
    unlocked: false,
    completed: false,
  },

  // Milestone: Mars Colony
  {
    id: 'mars_colony',
    name: 'Self-Sustaining Mars Colony',
    description: 'Closed-loop colony on Mars. Humanity is now multi-planetary.',
    era: 2,
    layer: 0,
    cost: { energy: 20000, materials: 25000, data: 15000, population: 0 },
    prerequisites: ['mars_isru', 'mars_greenhouse', 'fusion_research'],
    unlocked: false,
    completed: false,
  },
];

// All technologies combined
export const ALL_TECHNOLOGIES: Technology[] = [
  ...ERA_1_TECHNOLOGIES,
  ...ERA_2_TECHNOLOGIES,
];

/**
 * Get all technologies for an era
 */
export function getTechnologiesForEra(era: number): Technology[] {
  if (era === 1) return ERA_1_TECHNOLOGIES;
  if (era === 2) return ERA_2_TECHNOLOGIES;
  // Future: ERA_3, ERA_4
  return [];
}

/**
 * Get a technology by ID
 */
export function getTechnology(id: string): Technology | undefined {
  return ALL_TECHNOLOGIES.find(t => t.id === id);
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
