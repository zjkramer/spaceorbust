# contributing to spaceorbust

Every contribution advances humanity's journey to the stars.

## Ways to Contribute

### 1. Hackathon Challenges

The most structured way to contribute. Run `spaceorbust hackathon` to see active challenges:

- **Beginner**: Good first issues, documentation, lexicon
- **Intermediate**: Features, simulators, tools
- **Advanced**: Multi-transport, integrations
- **Moonshot**: Hardware prototypes, research

Hackathon contributions earn in-game resources AND real rewards.

### 2. Code Contributions

```bash
# Fork and clone
gh repo fork zjkramer/spaceorbust --clone
cd spaceorbust

# Install and build
npm install
npm run build

# Run tests
npm test

# Make your changes
git checkout -b feature/your-feature

# Test locally
node dist/cli/index.js status

# Submit PR
gh pr create
```

### 3. Documentation

- Improve README
- Add to the Lexicon (`docs/LEXICON.md`)
- Write tutorials
- Create diagrams

### 4. Game Design

- Propose new technologies for the tech tree
- Design new hackathon challenges
- Balance feedback on resource costs
- Era 3 & 4 content

### 5. Testing

- Test on different platforms
- Test offline sync features
- Report bugs with reproduction steps

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Document public functions
- Keep files focused (<500 lines)

### Commit Messages

```
<type>: <short description>

<longer description if needed>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Pull Requests

- One feature per PR
- Include tests for new features
- Update docs if needed
- Link to related issue/hackathon

## Architecture Guidelines

### Adding New Commands

1. Add handler to `src/cli/index.ts`
2. Add display functions to appropriate file
3. Update help text in `src/cli/display.ts`
4. Update README

### Adding Technologies

1. Add to appropriate era in `src/core/techtree.ts`
2. Ensure prerequisites are valid
3. Balance resource costs
4. Add lore description

### Adding Transports

1. Implement `Transport` interface in `src/comms/transport.ts`
2. Add to `TransportManager`
3. Test fragmentation for low-bandwidth channels
4. Document in README

## Testing Locally

```bash
# Build
npm run build

# Test commands
node dist/cli/index.js status
node dist/cli/index.js mission plan leo mars_orbit
node dist/cli/index.js hackathon
node dist/cli/index.js comms qr

# Test with GitHub (need token)
node dist/cli/index.js auth <token>
node dist/cli/index.js sync
```

## Communication

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas
- **Pull Requests**: Code contributions

No Discord. No Slack. Async communication only.

## Recognition

Contributors get:
- Listed in CONTRIBUTORS.md
- In-game "Contributor" badge
- Free contributor patches (physical!)
- Their commits fuel the game for everyone

## Code of Conduct

1. Be excellent to each other
2. Focus on the mission
3. Technical merit matters
4. No drama

We're here to get humanity to the stars. Everything else is secondary.

---

*"Every commit powers civilization forward."*
