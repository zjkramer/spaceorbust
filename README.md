# spaceorbust

```
╔══════════════════════════════════════════════════════════╗
║   Your code powers humanity's journey to the stars.      ║
╚══════════════════════════════════════════════════════════╝
```

> **This is real software, not just a game.**
>
> Space Or Bust includes a **production-ready dispatch system for fire departments and EMS** - free, open-source, no vendor lock-in. The "game" layer gamifies open-source contribution, but the tools underneath are built to save lives.
>
> [Try the Dispatch Demo](https://spaceorbust.com/dispatch.html) | [Read about the Dispatch Protocol](#dispatch-protocol-fireems-cad)

A terminal-based RPG where your GitHub commits fuel civilization's expansion into space. Real orbital mechanics. Multi-transport sync. Kaizen hackathons that solve actual spacefaring challenges.

## Demo

```
$ spaceorbust status

╔══════════════════════════════════════════════════════════╗
║   SPACEORBUST v0.1.0 | Year: 2024 | Era: Earth-Bound    ║
╚══════════════════════════════════════════════════════════╝

  RESOURCES
  ────────────────────────────────────────────────────────
  Watts ⚡:  [████████████████░░░░] 1,523⚡
  Mass:      [██████████░░░░░░░░░░] 847 kg
  Data:      [████░░░░░░░░░░░░░░░░] 256 TB
  Population: 1.0B souls

  FORGE CONNECTION
  ────────────────────────────────────────────────────────
  ✓ Connected: zjkramer (GitHub)
  Last sync: 2024-12-18
  Commits tracked: 127

$ spaceorbust mission plan leo mars_orbit

╔══════════════════════════════════════════════════════════╗
║                    MISSION PROFILE                       ║
╚══════════════════════════════════════════════════════════╝

  FROM: LEO
  TO:   MARS ORBIT

  MANEUVER SEQUENCE:
  ─────────────────────────────────────────────────
  1. Trans-Mars injection
     Δv: 3.60 km/s  |  Cumulative: 3.60 km/s

  2. Mars orbit insertion
     Δv: 1.00 km/s  |  Cumulative: 4.60 km/s

  ─────────────────────────────────────────────────
  TOTAL Δv REQUIRED: 4.60 km/s
  ─────────────────────────────────────────────────

  PROPELLANT REQUIREMENTS (10000 kg payload):
    Chemical (Methalox):  26,408 kg
    Nuclear Thermal:       6,840 kg
```

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

## Dispatch Protocol (Fire/EMS CAD)

A free, open-source CAD/dispatch system for fire departments and EMS. **No vendor lock-in. No per-seat licensing. Forever.**

**Live Demo**: [spaceorbust.com/dispatch](https://spaceorbust.com/dispatch.html)

**Live API**: [spaceorbust-production.up.railway.app](https://spaceorbust-production.up.railway.app/api/health)

### Features

- **Web-based SaaS** - Works in any browser, any device
- **Offline-first** - Keep dispatching when internet fails
- **Multi-language** - English & Spanish built-in
- **ADA accessible** - Screen readers, keyboard navigation, high contrast
- **Real-time sync** - Multiple dispatchers, WebSocket updates
- **NFIRS export** - Federal fire reporting compliance
- **Multi-transport** - Internet, Cellular, Starlink, LoRa mesh, Ham radio

### Quick Start (Dispatch)

```bash
# Docker (recommended for production)
docker-compose up -d

# Or run locally
cd src/server
npm install
npm run dev
```

### Transport Fallbacks

When internet fails, the system cascades through available transports:

| Priority | Transport | Range | License Required |
|----------|-----------|-------|------------------|
| 1 | Ethernet/WiFi | Local | No |
| 2 | Cellular | Varies | No |
| 3 | Starlink | Global | No |
| 4 | LoRa Mesh | ~10km | No |
| 5 | Ham/APRS | Unlimited | Yes (Technician) |
| 6 | QR Sync | Sneakernet | No |

### Fire Weather Integration

Real-time NWS data with fire danger indices:
- Fire Weather Index (FWI)
- Red Flag warnings
- Haines Index
- Burning Index
- Spread Component

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
├── server/        # Dispatch backend
│   ├── database.ts # SQLite offline-first
│   ├── auth.ts    # JWT authentication
│   ├── websocket.ts # Real-time sync
│   ├── nfirs.ts   # Federal reporting
│   └── api.ts     # REST endpoints
├── dispatch/      # Dispatch core
│   └── core/      # Abstractions
└── web/           # Web applications
    ├── app/       # Dispatch frontend
    │   ├── i18n.js      # Translations
    │   ├── connection.js # Multi-transport
    │   ├── weather.js   # NWS integration
    │   ├── radio.js     # Ham/APRS/LoRa
    │   └── sw.js        # Service worker
    └── mascots/   # Llama graphics
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

**Shop**: [spaceorbust.com/store](https://spaceorbust.com/store.html)

- T-shirts, hoodies, caps
- Space Or Bust branding with terminal aesthetic
- Achievement patches (requires unlocking)
- Contributor exclusives

100% of proceeds fund development. frack predatory private equity.

## Community

- **GitHub**: Issues, PRs, Discussions
- **Reddit**: Coming soon
- **Meetups**: Local hack nights, watch parties

No Discord. No Twitter. Signal over noise.

## License

**Code:** MIT License - Because space belongs to everyone. And so should public safety software.

**Brand:** Space Or Bust™ and the llama mascots are trademarks of Flatland Expeditions LLC. See [TRADEMARK.md](TRADEMARK.md) for brand usage guidelines.

**Free forever. frack predatory private equity.**

---

```
"In the void, clear communication is survival."
                                    - SpaceOrBust Lexicon
```

## Links

- **Website**: [spaceorbust.com](https://spaceorbust.com)
- **Dispatch Demo**: [spaceorbust.com/dispatch](https://spaceorbust.com/dispatch.html)
- **Store**: [spaceorbust.com/store](https://spaceorbust.com/store.html)
- **GitHub**: [github.com/zjkramer/spaceorbust](https://github.com/zjkramer/spaceorbust)
