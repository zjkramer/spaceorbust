# SpaceOrBust

```
╔══════════════════════════════════════════════════════════╗
║   Your code powers humanity's journey to the stars.      ║
╚══════════════════════════════════════════════════════════╝
```

A terminal-based RPG where your GitHub commits fuel civilization's expansion into space. Real orbital mechanics. Multi-transport sync. Kaizen hackathons that solve actual spacefaring challenges.

## Philosophy

Every watt of energy, every calorie counts in the void of space. This game reflects that reality:

- **Watt (⚡)** is the universal currency - energy is the true constraint
- **Real physics** - orbital mechanics match NASA values
- **Multiple comms channels** - sync via internet, LoRa mesh, ham radio, or QR codes
- **Hackathons build real tech** - challenges tied to the critical path of becoming spacefaring

## Quick Start

```bash
# Install
npm install -g spaceorbust

# Or run from source
git clone https://github.com/zjkramer/spaceorbust.git
cd spaceorbust
npm install
npm run build
node dist/cli/index.js status

# Connect your GitHub
spaceorbust auth <github-token>

# Sync your contributions
spaceorbust sync

# Check your civilization
spaceorbust status
```

## Commands

```
CORE:
  status        Show civilization status, resources, progress
  sync          Sync GitHub activity → collect resources
  auth          Connect GitHub/Gitea/Forgejo account
  research      View and complete tech tree research

MISSION OPS:
  mission plan <from> <to>      Calculate mission delta-v
  mission hohmann <r1> <r2>     Hohmann transfer calculator
  mission fuel <dv> <isp> <kg>  Propellant requirements
  mission bodies                Celestial body database
  mission engines               Engine reference (Isp values)

COMMUNICATIONS:
  comms status    Show transport status (TCP, LoRa, QR)
  comms qr        Generate QR code of your game state
  comms text      Human-readable state for manual sync
  comms send      Broadcast state via best transport

COMMUNITY:
  hackathon       View active kaizen challenges
  hackathon info <id>   Challenge details
  guild           Guild management (coming soon)
```

## Resource System

Your GitHub activity converts to game resources:

| Activity | Resource | Rate |
|----------|----------|------|
| Commits | Energy (⚡) | 10⚡ per commit |
| Merged PRs | Materials (kg) | 50 kg per PR |
| Issues closed | Data (TB) | 5 TB per issue |
| Code reviews | All | 3 each |

## Tech Tree

Based on NASA's actual technology roadmaps. Every dependency is physics.

**Era 1: Earth-Bound (2024-2050)**
- Reusable rockets, solar power, advanced materials
- Closed-loop life support, space medicine
- ISRU basics, additive manufacturing
- Milestone: Lunar landing

**Era 2: Inner Solar (2050-2150)**
- Lunar base, Mars transit, asteroid mining
- Fusion research, genetic adaptation
- Milestone: Self-sustaining Mars colony

## Hackathons

Real challenges. Real solutions. Real prizes.

```
CURRENT CHALLENGES:

[BEGINNER]     Expand the Lexicon
               Add terms to the shared human-machine vocabulary
               Rewards: 200⚡ + Lexicographer badge

[INTERMEDIATE] ECLSS Simulator
               Build a closed-loop life support simulator
               Rewards: 600⚡ + $25 merch credit

[INTERMEDIATE] Delta-V Calculator
               Orbital mechanics from scratch
               Rewards: 500⚡ + $25 merch credit

[ADVANCED]     Meshtastic Integration
               Sync game state over LoRa mesh
               Rewards: 1000⚡ + Meshtastic device kit

[MOONSHOT]     MOXIE Jr
               Design/prototype CO2→O2 ISRU device
               Rewards: 2000⚡ + $500 hardware budget
```

## Multi-Transport Sync

Internet down? No problem.

```
spaceorbust comms qr     # Generate QR code (504 chars)
spaceorbust comms text   # Human-readable format

# Output:
SOB/1.0/STATE/USER:ZJKRAMER/YEAR:2024/ERA:1/WATTS:1500/MASS:800/DATA:250
```

Sync via:
- **Internet** - TCP/WebSocket when available
- **LoRa Mesh** - Meshtastic devices, ~10km range
- **Packet Radio** - AX.25, requires ham license
- **QR Code** - Sneakernet, works anywhere
- **NFC/USB** - Tap-to-sync, offline transfer

## Architecture

```
src/
├── cli/           # Terminal interface
│   ├── index.ts   # Command router
│   ├── display.ts # ASCII rendering
│   ├── mission.ts # Mission ops display
│   └── comms.ts   # Communications CLI
├── core/          # Game logic
│   ├── types.ts   # Core types
│   ├── state.ts   # Persistence
│   ├── techtree.ts # Technology tree
│   ├── hackathon.ts # Kaizen system
│   └── guilds.ts  # Guild mechanics
├── physics/       # Real physics
│   └── orbital.ts # Orbital mechanics
├── comms/         # Multi-transport
│   ├── protocol.ts # Message protocol
│   └── transport.ts # Transport layer
├── forge/         # Git forge integration
│   ├── github.ts  # GitHub client
│   └── gitea.ts   # Gitea/Forgejo client
└── web/           # Dashboard (planned)
```

## Contributing

Every PR advances the mission. See active hackathons for structured challenges, or:

1. Fork the repo
2. Create a branch
3. Make your changes
4. Submit PR

Your contributions become in-game resources. Meta.

## Merchandise

Fund the mission. No pay-to-win.

- T-shirts, hoodies, hats
- Achievement patches (requires unlocking)
- Contributor exclusives

Coming soon at spaceorbust.com

## Community

- **GitHub**: Issues, PRs, Discussions
- **Reddit**: Coming soon
- **Meetups**: Local hack nights, watch parties

No Discord. No Twitter. Signal over noise.

## License

MIT - Because space belongs to everyone.

---

```
"In the void, clear communication is survival."
                                    - SpaceOrBust Lexicon
```
