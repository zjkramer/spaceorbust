# I Built a Game That Turns Your GitHub Activity Into a Space Civilization

What if every commit you made powered humanity's journey to the stars?

That's the premise behind **spaceorbust**, a terminal-based RPG where your real GitHub activity fuels a civilization's expansion from Earth to Mars and beyond.

## The Concept

```
Commits    → Energy (⚡)
PRs merged → Materials (🔧)
Issues     → Data (📊)
```

You sync your GitHub activity, collect resources, and research technologies based on NASA's actual roadmaps. The tech tree spans four eras:

1. **Earth-Bound** (2024-2050): Reusable rockets, solar power, orbital stations
2. **Inner Solar** (2050-2150): Moon bases, Mars colonies, asteroid mining
3. **Outer Solar** (2150-2300): Jupiter moons, fusion power, genetic adaptation
4. **Interstellar** (2300+): Generation ships, antimatter drives

## Quick Start

```bash
npm install -g spaceorbust
spaceorbust auth <your-github-token>
spaceorbust sync
spaceorbust status
```

## What Makes It Different

### Real Orbital Mechanics

The mission planner uses actual physics:

```bash
$ spaceorbust mission plan leo mars_orbit

MISSION: LEO → Mars Orbit
─────────────────────────────────────────────
Phase 1: LEO departure burn     ΔV: 3.6 km/s
Phase 2: Hohmann transfer       Time: 259 days
Phase 3: Mars orbit insertion   ΔV: 0.9 km/s

Total ΔV: 4.5 km/s
```

These numbers match NASA's actual mission profiles.

### Streak System

Sync daily to build a streak. Each day adds 1% bonus to resources earned, up to 30%:

```
🔥🔥🔥 STREAK: 14 days (14% bonus) 🔥🔥🔥
```

### Milestones

Unlock achievements as you progress:

- **First Light** - Complete your first sync (+100 Energy)
- **Kilocommit** - Track 1,000 commits (+1000 Energy, +500 Materials)
- **Martian** - Land humans on Mars (+5000 all resources)

### Visual Progression

Your colony grows in ASCII art as you research:

```
             🌙
              │
            │🏠│
              ·
                    🛰️ ISS
           *  .  * ╱
        .    🌍══╱═════╗
           * . *       ║
      ━━━━━━━┻━━━━━━━━━╝
     │  EARTH  BASE  │
     └───────────────┘
```

### Offline-First

Internet down? The game supports multiple transport protocols:

- **LoRa mesh** - Sync via radio
- **QR codes** - Scan to transfer state
- **Ham radio** - For the truly dedicated

## The Tech Tree

40+ technologies across 8 layers:

| Layer | Focus | Examples |
|-------|-------|----------|
| 0 | Prerequisites | Reusable Rockets, Solar Power |
| 1 | Survival | Closed-Loop Life Support |
| 2 | Food | Hydroponics, Mars Greenhouses |
| 3 | Resources | Water Extraction, ISRU |
| 4 | Building | Space 3D Printing |
| 5 | Power | Nuclear Fission, Fusion |
| 6 | Propulsion | Ion Drives, Methane Rockets |
| 7 | Communication | Deep Space Network |
| 8 | Biology | Genetic Adaptation, Bio-AI |

Each technology has real prerequisites. You can't build a Mars colony without solving life support first.

## Share Your Progress

```bash
$ spaceorbust share

🚀 spaceorbust Day 14

Era: Earth-Bound (1/4)
Techs: 8/42 [████░░░░░░]
Commits: 247
Streak: 14 days 🔥

My code powers humanity's journey to the stars.

npm install -g spaceorbust
https://spaceorbust.com

#spaceorbust #opensource #gamedev
```

## Why I Built This

I wanted to make a game that:

1. **Rewards real work** - Your actual coding contributes
2. **Teaches real science** - The physics and tech tree are accurate
3. **Works anywhere** - Terminal-based, runs on anything with Node.js
4. **Respects privacy** - All data stays local, only you see your progress

## What's Next

- **Guilds** - Team up with other developers
- **Leaderboards** - Compare progress globally
- **Web version** - Play in the browser
- **More hackathons** - Real coding challenges with in-game rewards

## Try It

```bash
npm install -g spaceorbust
```

Source: [github.com/zjkramer/spaceorbust](https://github.com/zjkramer/spaceorbust)
Website: [spaceorbust.com](https://spaceorbust.com)

---

*What features would make this more engaging for you? Drop a comment!*

---

**Tags:** #gamedev #opensource #typescript #github #space
