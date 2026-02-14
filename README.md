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

## Google Sheets Class Average Setup

This app now supports:
- Student auto-submit to Google Sheets when they finish.
- Instructor aggregate dashboard at `/#/admin` (no individual responses shown).

### 1. Create the Google Apps Script endpoint

1. Open a new Google Sheet.
2. Open **Extensions → Apps Script**.
3. Paste in `/Users/nealcaren/Documents/GitHub/soci101-games/gender-iat/gender-iat-app/google-apps-script.gs`.
4. Deploy as **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web app URL (ends in `/exec`).

### 2. Add your endpoint URL to the app

Create `.env.local` in `/Users/nealcaren/Documents/GitHub/soci101-games/gender-iat/gender-iat-app`:

```bash
cp .env.example .env.local
```

Then set:

```env
VITE_GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/your-id/exec"
```

Restart `pnpm dev` after changing env vars.

### 3. Use it in class

- Student URL: normal app URL.
- Instructor URL: same URL plus `/#/admin`.

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
