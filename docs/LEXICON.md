# SpaceOrBust Lexicon

> A shared language for humans and machines navigating the void.

This lexicon seeds the vocabulary of SpaceOrBust. It will grow organically as the community evolves. Core terms are physics-grounded. Slang emerges from play.

---

## Currency

### Watt (⚡)
The universal unit of value. Everything costs energy. Everything.

```
Symbol: ⚡
Base unit: 1 Watt-hour (Wh)
Notation: 100⚡, 1.5K⚡, 2.3M⚡
```

**Why Watts?**
- Energy is the true constraint in space
- No inflation - physics doesn't change
- Bridges digital (compute) and physical (life support)
- Honest accounting - you can't fake thermodynamics

**Conversions:**
```
1 human-day of life support    ≈ 2,400⚡
1 kg to Low Earth Orbit        ≈ 10,000⚡
1 commit (game resource)       = 10⚡
1 merged PR                    = 50⚡
```

---

## Core Terms

### Operations

| Term | Meaning | Usage |
|------|---------|-------|
| **Sync** | Update state from forge; collect resources | "Did you sync today?" |
| **Burn** | Spend energy/resources | "That research burns 500⚡" |
| **Delta-v** | Capacity for change; available resources | "Low on delta-v this sprint" |
| **Nominal** | Operating within expected parameters | "Systems nominal" |
| **Off-nominal** | Something's wrong | "We're off-nominal on life support" |
| **Hard vacuum** | Critical failure state | "Don't go hard vacuum on me" |

### States

| Term | Meaning | Usage |
|------|---------|-------|
| **Closed-loop** | Self-sustaining; no external dependencies | "The colony is closed-loop now" |
| **Open-loop** | Dependent on resupply | "Still open-loop on food" |
| **Orbital** | Achieved sustainable state | "We went orbital last month" |
| **Suborbital** | Almost there; not quite sustainable | "Still suborbital on energy" |
| **Grounded** | Stuck; blocked; no progress | "Research is grounded" |

### Progress

| Term | Meaning | Usage |
|------|---------|-------|
| **Launch window** | Opportunity to act | "The launch window closes Friday" |
| **Insertion burn** | Initial effort to start something | "Insertion burn on the new feature" |
| **Coast phase** | Steady progress; low effort | "Coasting to release" |
| **Aerobrake** | Slow down; reduce scope | "Need to aerobrake this sprint" |
| **Gravity assist** | Leverage external help | "Got a gravity assist from the guild" |

### Resources

| Term | Meaning | Usage |
|------|---------|-------|
| **Propellant** | Energy reserves for major changes | "Burning propellant on refactor" |
| **Consumables** | Resources that deplete | "Low on consumables" |
| **ISRU** | Making resources locally | "ISRU that dependency" |
| **Mass budget** | Resource constraints | "Over mass budget" |

### Social

| Term | Meaning | Usage |
|------|---------|-------|
| **Crew** | Your team/guild | "Crew's syncing tomorrow" |
| **Mission Control** | Leadership; coordinators | "Mission Control approved" |
| **EVA** | Working outside your comfort zone | "EVA into that codebase" |
| **Dock** | Join/collaborate | "Docking with their PR" |
| **Undock** | Separate; go independent | "Undocking for solo work" |

---

## Phonetic Alphabet (Space Variant)

For clear communication across noisy channels:

| Letter | Word | Origin |
|--------|------|--------|
| A | **Apogee** | Highest orbit point |
| B | **Burn** | Propulsion |
| C | **Capsule** | Crew vehicle |
| D | **Delta** | Change |
| E | **Eclipse** | Shadow |
| F | **Flux** | Energy flow |
| G | **Gravity** | The enemy |
| H | **Habitat** | Home |
| I | **Insertion** | Orbit entry |
| J | **Jettison** | Release |
| K | **Kelvin** | Temperature |
| L | **Lunar** | Moon |
| M | **Mass** | The constraint |
| N | **Nominal** | Normal |
| O | **Orbital** | Stable |
| P | **Payload** | Cargo |
| Q | **Quasar** | Distant light |
| R | **Retrograde** | Against motion |
| S | **Solar** | Sun-powered |
| T | **Thrust** | Force |
| U | **Umbra** | Deep shadow |
| V | **Vector** | Direction |
| W | **Watt** | Energy |
| X | **X-ray** | Radiation |
| Y | **Yaw** | Rotation |
| Z | **Zenith** | Straight up |

---

## Numbers

```
0 = Zero (always explicit)
1 = One
2 = Two
3 = Tree (avoid "three/free" confusion)
4 = Fower (avoid "four/for" confusion)
5 = Fife (avoid "five/fire" confusion)
6 = Six
7 = Seven
8 = Eight
9 = Niner (avoid "nine/nein" confusion)
```

---

## Time

SpaceOrBust uses **Mission Elapsed Time (MET)** for game events:

```
T-minus: Before launch/event
T-plus: After launch/event
Day 0: Game start
Year: In-game year (starts 2024)
```

**Real-world sync:**
- 1 real day = variable game time (based on activity)
- Active contribution accelerates time
- Idle time passes slowly

---

## Status Codes

Borrowed from HTTP, adapted for space:

| Code | Meaning | Usage |
|------|---------|-------|
| **200** | Nominal | All systems go |
| **201** | Created | New entity spawned |
| **301** | Relocated | Moved permanently |
| **400** | Bad Request | Invalid command |
| **401** | Unauthorized | Need auth |
| **403** | Forbidden | Not allowed |
| **404** | Not Found | Resource missing |
| **409** | Conflict | Resource contention |
| **418** | I'm a teapot | Easter egg |
| **429** | Rate Limited | Too many requests |
| **500** | System Failure | Critical error |
| **503** | Offline | Maintenance |

---

## Slang (Community-Contributed)

*This section grows organically. Submit terms via PR.*

| Term | Meaning | Origin |
|------|---------|--------|
| *TBD* | *First community term goes here* | *Community* |

---

## Machine Communication

For human-AI and AI-AI communication, a structured subset:

```
// Request format
{action}.{target}.{parameters}

// Examples
sync.forge.github
research.start.reusable_rockets
guild.join.alpha_colony
status.query.resources

// Response format
{status}.{data}

// Examples
200.{energy:500,materials:200}
404.technology_not_found
201.research_started
```

---

## Principles

1. **Precision over poetry** - Say exactly what you mean
2. **Physics-grounded** - Terms should map to reality
3. **Bilingual by default** - Works for humans AND machines
4. **Extensible** - Community can add, never subtract
5. **No jargon gatekeeping** - Always explain to newcomers

---

## Contributing

To add a term:
1. Fork the repo
2. Add to appropriate section
3. Include: Term, Meaning, Usage example
4. PR with rationale

Terms graduate from "Slang" to "Core" based on adoption.

---

*"In the void, clear communication is survival."*
