# SpaceOrBust - Game Design Document

## Overview

SpaceOrBust is a civilization-strategy RPG where players guide the evolution of intelligent life from Earth-bound species to a multi-planetary, spacefaring society. Real GitHub activity drives progression.

---

## Core Loop

```
GitHub Activity → Resources → Research/Build → Expand → New Challenges → Repeat
```

1. **Contribute**: Player makes commits, PRs, issues on GitHub
2. **Earn**: Activity converts to in-game resources (energy, materials, data)
3. **Spend**: Resources fund research, construction, and expansion
4. **Progress**: Unlock new technologies, colonize new worlds
5. **Evolve**: Species adapt and advance through evolutionary milestones

---

## GitHub Integration

### Activity Mapping

| GitHub Action | In-Game Resource | Multiplier |
|---------------|------------------|------------|
| Commit | Energy | Base |
| Pull Request (merged) | Materials | 2x |
| Issue (opened) | Data | 0.5x |
| Issue (closed) | Data | 1x |
| Code Review | Research Points | 1.5x |
| Release | Milestone Bonus | 5x |

### Collaboration Bonuses
- Contributing to others' repos: +50% resources
- Multiple contributors on same PR: Shared bonus pool
- Maintaining streaks: Compound multiplier

---

## Three Pillars of Evolution

### 1. Humans
- **Early Game**: Societal organization, early space programs
- **Mid Game**: Genetic adaptation, generation ships, Mars colonies
- **Late Game**: Post-biological transcendence, interstellar travel

### 2. AI
- **Early Game**: Tool AI, automation, narrow intelligence
- **Mid Game**: General AI emergence, digital consciousness
- **Late Game**: AI-human merger, distributed intelligence across solar system

### 3. Bios (Engineered Life)
- **Early Game**: GMO crops, biofuels, synthetic biology
- **Mid Game**: Terraforming organisms, space-adapted life
- **Late Game**: Living ships, planetary ecosystems, symbiotic civilizations

---

## Tech Tree (High-Level)

### Era 1: Earth-Bound (Present - 2050)
- Renewable energy mastery
- Early AI development
- Reusable rockets
- Genetic engineering basics

### Era 2: Inner Solar System (2050 - 2150)
- Moon bases
- Mars colonization
- Asteroid mining
- Fusion power
- Human genetic adaptation

### Era 3: Outer Solar System (2150 - 2300)
- Jupiter moon settlements
- Generation ships
- Advanced AI consciousness
- Terraforming technology

### Era 4: Interstellar (2300+)
- FTL research
- Dyson swarm construction
- Post-biological existence
- First contact protocols

---

## Resource Types

| Resource | Source | Use |
|----------|--------|-----|
| **Energy** | Commits, solar/fusion | Powers everything |
| **Materials** | PRs, mining | Construction |
| **Data** | Issues, research | Tech advancement |
| **Population** | Growth, migration | Labor, expansion |
| **Harmony** | Balance between pillars | Stability, cooperation bonuses |

---

## Risk Events

Players must navigate existential challenges:

- **Climate tipping points**
- **AI alignment failures**
- **Pandemic outbreaks**
- **Resource wars**
- **Solar events**
- **Asteroid impacts**

Preparation through research and resource allocation determines survival.

---

## Multiplayer / Community

- **Shared Universe**: All players contribute to one canonical timeline
- **Factions**: Players can align with Human, AI, or Bio priorities
- **Governance**: Community votes on major civilization decisions
- **Lore Contributions**: Players can submit story events, characters, histories

---

## Social & RPG Elements

### Guilds
- Form crews, colonies, or research teams with other players
- Guild-specific projects and shared resource pools
- Guild halls (virtual spaces for coordination)
- Inter-guild competitions and alliances
- Specializations: Mining guilds, Research collectives, Exploration fleets

### Role-Playing
- **Character Creation**: Design your avatar - human, AI, or bio-hybrid
- **Roles/Classes**:
  - Engineer: Bonus to construction and repair
  - Scientist: Faster research, discovery bonuses
  - Pilot: Ship handling, exploration rewards
  - Diplomat: Better trade deals, alliance bonuses
  - Biologist: Terraforming expertise, life adaptation
- **Narrative Events**: Story-driven missions with choices
- **In-character communication**: Optional RP channels and forums
- **Achievements & Titles**: Earn ranks like "First Martian", "AI Whisperer", "Void Walker"

### Social Features
- Player profiles with contribution history
- Messaging and guild chat
- Event coordination (community missions)
- Mentorship system for new players

---

## Merchandise & Sustainability

### Physical Goods
- **T-shirts**: Faction logos, mission patches, era artwork
- **Hoodies**: Guild insignias, ship classes, "I survived [event]" editions
- **Hats**: Minimalist logos, rank insignias
- **Patches**: Collectible mission patches, achievement badges, guild emblems

### Merchandise Integration
- Unlock digital merch designs through gameplay achievements
- Limited edition drops tied to community milestones
- Contributor-exclusive designs for major open-source contributors
- Physical patch = digital badge crossover

### Revenue Model
- Merch sales fund development and server costs
- No pay-to-win mechanics
- Optional cosmetic purchases (skins, badges, ship decals)
- Transparent finances (open-source project = open finances?)

---

## CLI Interface Concepts

```
$ spaceorbust status
═══════════════════════════════════════════════
  SPACEORBUST v0.1.0 | Year: 2087 | Era: Inner Solar
═══════════════════════════════════════════════
  Energy:    ████████░░ 847/1000
  Materials: ██████░░░░ 612/1000
  Data:      █████████░ 923/1000

  Active Projects:
  → Mars Dome Beta [████████░░] 78%
  → Fusion Reactor III [██░░░░░░░░] 23%

  Recent Events:
  • Colony ship "Persistence" reached Ceres
  • AI Ethics Council formed
  • New contributor bonus: +150 energy
═══════════════════════════════════════════════

$ spaceorbust research list
$ spaceorbust build <structure>
$ spaceorbust sync  # Pull latest GitHub activity
```

---

## Web Dashboard Concepts

- **Solar System Map**: Interactive view of colonies, ships, stations
- **Tech Tree Visualizer**: Explorable research paths
- **Timeline**: Historical events and future projections
- **Contributor Leaderboard**: Top builders ranked by impact
- **Evolution Tracker**: Progress of all three pillars

---

## Open Questions

- [ ] How to balance solo vs collaborative play?
- [ ] Real-time vs turn-based mechanics?
- [ ] Persistence model (save states, cloud sync)?
- [ ] Monetization (if any) - cosmetics only?
- [ ] How literal should GitHub mapping be?

---

## Next Steps

1. Prototype CLI with basic `status` and `sync` commands
2. Design GitHub webhook handler
3. Define initial tech tree (Era 1)
4. Create simple resource calculation engine
