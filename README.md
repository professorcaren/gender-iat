# Gender IAT

A game-like Implicit Association Test (IAT) for SOCI 101 lectures. Students open it on their phones during class, complete a ~2-minute speed-sorting activity, and see their results — sparking discussion about implicit bias.

**Live:** https://professorcaren.github.io/gender-iat/

## How It Works

Students sort words by tapping the left or right side of the screen:

| Round | Left Side | Right Side | Trials |
|-------|-----------|------------|--------|
| 1 (Practice) | Male | Female | 8 |
| 2 (Practice) | Boss Mode | Care Mode | 8 |
| 3 (Combo) | Male + Boss Mode | Female + Care Mode | 20 |
| 4 (Combo) | Female + Boss Mode | Male + Care Mode | 20 |

The test measures whether students sort faster when gender and role categories are paired in culturally stereotypical ways. Results are shown as a D-score with a plain-language explanation.

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

To produce a single standalone HTML file:

```bash
bash bundle-artifact.sh
```

## Roadmap

- [ ] Add live class leaderboard/histogram (Firebase, fallback to Google Sheets)
- [ ] Build college majors gender-association game (separate repo in professorcaren org)
