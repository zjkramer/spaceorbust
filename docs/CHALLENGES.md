# SpaceOrBust Hackathon Challenges

Active challenges for the community. Complete these to earn resources, badges, and real prizes.

Run `spaceorbust hackathon` to see current status.

---

## Beginner Tier

### Expand the Lexicon

**ID**: `challenge-lexicon-expansion`

Add 10+ terms to the SpaceOrBust vocabulary (`docs/LEXICON.md`).

**Requirements**:
- At least 10 new terms
- Each term: definition, usage example, origin
- Relevant to space operations
- At least 2 terms for machine communication

**Constraints**:
- Physics-grounded (no fantasy)
- No duplicates
- Pronounceable over radio

**Rewards**:
- 200⚡ Energy
- 100 kg Materials
- 300 TB Data
- `lexicographer` badge

**Timeline**: Rolling - submit anytime

---

## Intermediate Tier

### ECLSS Simulator

**ID**: `challenge-eclss-sim`

Build a closed-loop life support system simulator.

**Requirements**:
- Simulate O2 consumption and CO2 production
- Model water recovery (target: 93%+ efficiency)
- Track consumables depletion
- Visualize system state (CLI or web)
- Allow scenario injection (failures, varying crew size)

**Constraints**:
- Use real ECLSS data from NASA
- TypeScript or Rust preferred
- Must run standalone (no cloud dependencies)

**Resources**:
- [NASA ECLSS Documentation](https://www.nasa.gov/mission_pages/station/research/experiments/explorer/Investigation.html?#id=929)
- ISS life support specifications
- `src/core/types.ts` for data structures

**Rewards**:
- 600⚡ Energy
- 400 kg Materials
- 500 TB Data
- `life_support_engineer` badge
- `simulator_builder` badge
- $25 merch credit

**Judging**:
- Accuracy (35%): Does it match real ECLSS behavior?
- Completeness (25%): All requirements met?
- Code Quality (20%): Clean, documented, tested?
- Usability (20%): Easy to use and understand?

---

### Delta-V Calculator

**ID**: `challenge-orbital-calculator`

Build a delta-v calculator for common space maneuvers.

**Requirements**:
- Calculate delta-v for Hohmann transfer orbits
- Support plane change maneuvers
- Model gravity assists (basic)
- Include common destinations (LEO, Moon, Mars, asteroids)
- CLI interface with optional web visualization

**Constraints**:
- Use real orbital mechanics equations
- Accuracy within 5% of NASA tools
- No external physics engines (implement from scratch)

**Resources**:
- Orbital Mechanics for Engineering Students (Curtis)
- JPL Horizons ephemeris data
- Our existing implementation: `src/physics/orbital.ts`

**Rewards**:
- 500⚡ Energy
- 300 kg Materials
- 700 TB Data
- `orbital_mechanic` badge
- `trajectory_designer` badge
- $25 merch credit

**Judging**:
- Accuracy (40%): Matches known delta-v values?
- Completeness (25%): Supports all required maneuvers?
- Integration (20%): Works with SpaceOrBust codebase?
- Documentation (15%): Well-documented for learning?

---

### Dispatch Protocol Features

**ID**: `challenge-dispatch-protocol`

Build features for the free fire department dispatch software.

**Requirements**:
- Pick a feature from the Dispatch Protocol roadmap
- Implement with full i18n support (EN/ES/FR)
- ADA-compliant accessibility
- Works offline (PWA compatible)
- Tests for critical paths

**Suggested Features**:
- Real-time GPS tracking for units
- CAD integration (Computer-Aided Dispatch)
- Radio PTT integration
- Incident reports export (PDF/CSV)
- Multi-agency mutual aid coordination
- Voice-to-text dispatch notes
- Mobile companion app

**Constraints**:
- TypeScript
- No vendor lock-in (open standards)
- Must work for rural volunteer departments
- Privacy-first (no unnecessary data collection)

**Resources**:
- `/src/web/dispatch.html` - Current demo
- `/src/dispatch/` - Backend services
- NFPA dispatch standards
- [why.html](/why.html) - Project mission

**Rewards**:
- 500⚡ Energy
- 400 kg Materials
- 300 TB Data
- `first_responder` badge
- `public_service` badge
- Merch (t-shirt of choice)

**Judging**:
- Usefulness (35%): Will fire departments actually use this?
- Accessibility (25%): Works for all users?
- Reliability (25%): Battle-tested quality?
- Documentation (15%): Easy to maintain?

**Timeline**: Rolling - submit anytime

---

## Advanced Tier

### Meshtastic Integration

**ID**: `challenge-mesh-sync`

Implement SpaceOrBust state sync over LoRa mesh networks.

**Requirements**:
- Send/receive SpaceOrBust messages via Meshtastic
- Handle message fragmentation for large states
- Implement store-and-forward for offline nodes
- Compress payloads to fit LoRa constraints (<256 bytes)
- Test with real Meshtastic hardware or simulator

**Constraints**:
- Must work with `src/comms/protocol.ts`
- Compatible with Meshtastic firmware 2.0+
- Battery-efficient (low duty cycle)

**Resources**:
- [Meshtastic Protocol Docs](https://meshtastic.org/docs/developers/)
- `src/comms/protocol.ts`
- `src/comms/transport.ts`
- LoRa physical layer specs

**Rewards**:
- 1000⚡ Energy
- 800 kg Materials
- 600 TB Data
- `mesh_master` badge
- `radio_operator` badge
- `offline_hero` badge
- $55 merch credit (hoodie)
- **Meshtastic LoRa device kit**

**Judging**:
- Functionality (35%): Does it actually work over LoRa?
- Reliability (25%): Handles failures gracefully?
- Efficiency (20%): Minimal bandwidth and power?
- Integration (20%): Clean integration with protocol.ts?

---

## Moonshot Tier

### MOXIE Jr: CO2 to O2

**ID**: `challenge-isru-prototype`

Design and document (or prototype) a small-scale ISRU device that converts CO2 to O2.

**Requirements**:
- Technical design document for CO2 electrolysis
- Bill of materials with cost estimates
- Safety analysis
- Optional: Working prototype (even at tiny scale)
- Integration plan with SpaceOrBust tech tree

**Constraints**:
- Must use solid oxide electrolysis or comparable tech
- Budget: <$500 for prototype materials
- Must be safe for amateur operation

**Resources**:
- [NASA MOXIE Mission Data](https://mars.nasa.gov/mars2020/spacecraft/instruments/moxie/)
- Solid oxide electrolysis research papers
- Maker community resources

**Rewards**:
- 2000⚡ Energy
- 2500 kg Materials
- 1500 TB Data
- `isru_pioneer` badge
- `hardware_hacker` badge
- `oxygen_maker` badge
- $100 merch credit
- **Featured in SpaceOrBust documentary**
- **$500 hardware budget for next project**

**Judging**:
- Feasibility (30%): Can this actually be built?
- Safety (25%): Safe for amateur operation?
- Documentation (25%): Reproducible by others?
- Innovation (20%): Novel approach or optimization?

**Timeline**: 6 months

---

## Proposing New Challenges

Have an idea for a challenge? Open an issue with:

1. **Title**: Clear, descriptive name
2. **Tier**: Beginner, Intermediate, Advanced, or Moonshot
3. **Domain**: Which critical path layer does it address?
4. **Requirements**: What must be delivered?
5. **Constraints**: Technical limitations
6. **Why**: How does this advance the mission?

Community votes on new challenges. Most-wanted get added.

---

## Judging Process

1. Submit via PR before deadline
2. 3 volunteer judges review
3. Scores averaged across criteria
4. Winners announced in Discussions
5. Prizes distributed within 2 weeks

All submissions become part of SpaceOrBust (MIT license).

---

*"Real challenges. Real solutions. Real progress."*
