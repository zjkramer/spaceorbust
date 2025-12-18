# spaceorbust Growth Plan

> Designed: 2025-12-18

## 1. Make It More Fun: Rewarding Core Loop

### Current Problem
The loop is: commit → sync → see numbers go up → research (if you remember)
**Missing**: Feedback, surprise, progression feeling, dopamine hits

### Design: Reward System

#### A. Sync Celebrations
When you sync, show what happened with flair:

```
$ spaceorbust sync

  SYNC COMPLETE
  ─────────────────────────────────────────────────────────

  ┌─────────────────────────────────────────────────────┐
  │  ★ MILESTONE: 100 commits tracked!                  │
  │    "First steps toward the stars."                  │
  │    Bonus: +50 Energy                                │
  └─────────────────────────────────────────────────────┘

  Activity detected:
    12 commits     → +120 Energy ⚡
    2 PRs merged   → +100 Materials 🔧
    3 issues closed → +45 Data 📊

  Total: +120⚡ +100🔧 +45📊

  STREAK: 5 days! (1.05x multiplier active)
```

#### B. Milestones System
Unlockable achievements that give bonuses:

| Milestone | Trigger | Reward |
|-----------|---------|--------|
| First Light | First sync | +100 Energy |
| Century | 100 commits | +50 Energy |
| Kilocommit | 1,000 commits | +500 Energy, unlock title |
| Merger | First PR merged | +100 Materials |
| Knowledge Seeker | 10 issues closed | +100 Data |
| Dedicated | 7-day streak | +100 all resources |
| Monthly Mission | 30-day streak | +500 all resources |
| Researcher | First tech researched | +50 Data |
| Era Pioneer | Enter Era 2 | Special ASCII art unlock |

#### C. Daily/Weekly Challenges
Random mini-goals that appear:

```
TODAY'S CHALLENGE: Close 2 issues
Reward: +100 Data, +25 Energy
Progress: [█░░░░░░░░░] 0/2
```

#### D. Streak System
Already in code but not surfaced. Make it visible and impactful:
- Show streak prominently in status
- Streak multiplier grows: 1% per day, max 30%
- Streak freeze tokens (earned from milestones)

---

## 2. ASCII Art Progression

### Concept: Your Colony Grows Visually

The status screen shows an ASCII representation that evolves:

#### Era 1: Earth-Bound (0-5 techs)
```
         🌍
        /   \
    ───┴─────┴───
   │ EARTH BASE │
   └─────────────┘
```

#### Era 1: Progress (5-10 techs)
```
         🌍          🛰️
        /   \       ╱
    ───┴─────┴─────╱────
   │ EARTH BASE │══════│ ISS │
   └─────────────┘     └─────┘
```

#### Era 1: Moon Mission (10-15 techs)
```
     🌙
      │
      │  ╭──╮
      └──│🚀│
         ╰──╯
         🌍          🛰️
        /   \       ╱
    ───┴─────┴─────╱────
   │ EARTH BASE │══════│ ISS │
   └─────────────┘     └─────┘
```

#### Era 2: Mars (after lunar_landing)
```
                        🔴 Mars Colony
     🌙 Lunar Base       │
      │      ╭──╮       ╭┴─╮
      └──────│⛏️│·······│🏠│
             ╰──╯       ╰──╯
         🌍          🛰️
        /   \       ╱
    ───┴─────┴─────╱────
   │ EARTH BASE │══════│ ISS │
   └─────────────┘     └─────┘
```

### Implementation
- Function `getColonyArt(state)` returns appropriate ASCII
- Based on: era, completed technologies, milestones
- Show in `status` command above resources

---

## 3. Social Proof Strategy

### A. Share Command
```
$ spaceorbust share

  SHARE YOUR PROGRESS
  ─────────────────────────────────────────────────────────

  Copy this to share on social media:

  ────────────────────────────────────────────────
  🚀 spaceorbust Day 14

  Era: Earth-Bound → Inner Solar (2/4)
  Commits: 247 | Techs: 8/32

       🌙
        │
    ────┴────
   │ Progress │
   └──────────┘

  My code powers humanity's journey to the stars.
  https://spaceorbust.com

  #spaceorbust #gamedev #opensource
  ────────────────────────────────────────────────
```

### B. Leaderboard (Future)
- Optional: Connect player ID to spaceorbust.com
- Show global stats: total commits, collective progress
- Guild rankings

---

## 4. Hackathon Launch: "Expand the Lexicon"

### First Challenge Details

**Name**: Expand the Lexicon
**Tier**: Beginner
**Duration**: Ongoing (rolling submissions)

**Description**:
The shared vocabulary between humans and machines defines our future.
Add terms to `docs/LEXICON.md` that help bridge understanding.

**Requirements**:
1. Fork the repo
2. Add 3+ terms to LEXICON.md following the format
3. Each term needs: word, definition, usage example, category
4. Submit PR with title "Lexicon: [your terms]"

**Rewards**:
- 500 Energy (in-game)
- Contributor badge on GitHub
- Name in CONTRIBUTORS.md

**How to Launch**:
1. Create GitHub Issue template for submissions
2. Add "hackathon" label
3. Tweet/post announcement
4. Monitor and merge quality submissions

---

## 5. Launch Posts

### Hacker News (Show HN)

**Title**: Show HN: spaceorbust – Terminal RPG where GitHub commits power space civilization

**Body**:
```
I built a CLI game where your real GitHub activity fuels humanity's expansion into space.

- Commits become energy
- PRs become materials
- Issues become research data

The tech tree is based on NASA's actual roadmaps. Orbital mechanics are real (Hohmann transfers, delta-v budgets).

Features:
- Works offline (sync via LoRa, QR codes, ham radio)
- 40+ technologies from reusable rockets to fusion power
- Kaizen hackathons with real coding challenges
- Git-forge agnostic (GitHub now, Gitea/Forgejo soon)

Install: npm install -g spaceorbust

Source: https://github.com/zjkramer/spaceorbust
Website: https://spaceorbust.com

I'd love feedback on the game balance and what features would make it more engaging.
```

### Reddit r/gamedev

**Title**: I made a terminal-based RPG where your GitHub commits power a space civilization

**Body**: Same as HN, add:
```
Tech stack: TypeScript, Node.js, pure ASCII (no dependencies for display)

The hardest part was making the orbital mechanics accurate while keeping it fun.
Happy to answer questions about the design decisions!
```

### Reddit r/programming

**Title**: spaceorbust: Your commits become energy, PRs become materials, issues become data

**Body**: Focus on technical aspects + the forge-agnostic architecture

### dev.to

**Title**: I Built a Game That Turns Your GitHub Activity Into a Space Civilization

**Format**: Tutorial-style article with:
1. The concept
2. How it works (code snippets)
3. The tech tree design
4. Try it yourself
5. Call for contributors

---

## Implementation Priority

### Phase 1: Make It Fun (This Week)
1. [ ] Add milestone system
2. [ ] Add streak visibility + multiplier
3. [ ] Enhanced sync output with celebrations
4. [ ] Basic ASCII colony art in status

### Phase 2: Social Features (Next Week)
5. [ ] `share` command
6. [ ] Screenshot-friendly output mode

### Phase 3: Launch (After Phase 1-2)
7. [ ] Write HN post
8. [ ] Write Reddit posts
9. [ ] Prepare for feedback flood

### Phase 4: Iterate
10. [ ] Respond to feedback
11. [ ] Fix bugs users find
12. [ ] Add requested features

---

*"The best time to plant a tree was 20 years ago. The second best time is now."*
