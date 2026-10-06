# Essay Practice Lab

A focused, local-first timed essay practice application for engineering students preparing for placement-style written assessments (Infosys-style essays and similar formats).

## Purpose

Train the skill of producing a coherent 160–200 word essay under a strict clock. The app trains — it never writes for you. No AI assistance during practice; guidance exists before and review afterwards.

## Features

- **Timed writing sessions** with a drift-free, timestamp-based countdown (warning states at 3 min / 1 min / final 10 s)
- **Two modes** — Guided Practice (subtle phase reminders) and Exam Simulation (minimal chrome, no hints)
- **Topic library** — 20 seeded placement-style topics with category / difficulty / status filters and a weighted "Surprise me" picker
- **Configurable practice profiles** — Infosys (10 min / 160–200 words, recommended 192–200), Tech Mahindra (15 min / 200), Tech Mahindra Extended (25 min / 300), plus a fully custom profile via Settings
- **Live word count** with neutral Below / On / Over target feedback and a progress bar
- **Autosave + recovery** — accidental refresh offers "Resume your previous session?"
- **Writing Signals review** — deterministic, rule-based checks (word count, sentence length, paragraphs, long sentences, repeated words/punctuation, capitalization, a small spelling watchlist, transition and conclusion markers) — explicitly not a grammar score
- **Transparent Practice Score** (100 pts: word count 25, structure 25, time management 20, sentence signals 15, revision behaviour 15) with visible rules
- **Progress dashboard** — streaks, daily goal, averages, personal bests, CSS bar charts, strongest / weakest dimensions
- **Session history** — view, delete, clear-all (with confirmation)
- **Settings** — theme (light/dark/system), editor font size, timer sound, warnings, default mode, word targets, default duration
- **Accessibility** — semantic HTML, real buttons, labelled controls, visible focus, aria-live status, works without a mouse
- **Privacy** — everything stays in `localStorage`; nothing is transmitted

## Technology stack

HTML5 + CSS3 + vanilla JavaScript (ES6). No frameworks, no libraries, no build step, no network calls.

## Folder structure

```
app/
├── index.html   — all screens and dialogs
├── styles.css   — design system (tokens, components, responsive)
├── app.js       — data, storage, router, timer, editor, analyzer, scoring, progress
└── README.md
```

## How to run

Open `index.html` directly in a browser, or serve statically:

```
npx serve .
# or
python3 -m http.server 8000
```

## Publish on GitHub Pages

This is a static site, so it can be hosted for free with GitHub Pages. The repository includes a GitHub Actions workflow that deploys the site automatically whenever changes are pushed to the `main` branch.

1. Create a **public** repository on GitHub. Do not add a README, `.gitignore`, or license during creation because this project already contains them.
2. From this project folder, initialize Git and push the first commit:

   ```
   git init
   git branch -M main
   git add .
   git commit -m "Initial release"
   git remote add origin https://github.com/<your-username>/<your-repository>.git
   git push -u origin main
   ```

3. On GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions** if it is not selected automatically.
4. Open the completed **Deploy static site to GitHub Pages** workflow run. GitHub will show the public website URL there. It will normally be:
   `https://<your-username>.github.io/<your-repository>/`

The workflow uploads only the static site files. The local `.venv` directory is excluded and is not needed to run or host this app.

## Customizing topics

Edit the `TOPICS` array at the top of `app.js`. Each entry: `{ id, title, category, difficulty }` where difficulty is `Easy`, `Medium`, or `Challenging`.

## Changing timer settings

- Per session: choose a practice profile on the pre-writing screen.
- Custom defaults: Settings → default duration and word targets (used by the "Custom" profile).
- Built-in profiles: edit the `PROFILES` array in `app.js`.

## How localStorage works

Namespaced keys, all defensively parsed:

- `essayLab.settings` — preferences
- `essayLab.currentSession` — autosaved live session (for recovery)
- `essayLab.history` — completed session records (capped at 200)
- `essayLab.topicStats` — per-topic practice counts and best scores
- `essayLab.recentTopics` — recent "Surprise me" picks (to avoid repeats)

## Privacy

Essays and statistics never leave your browser. Clearing site data removes everything.

## Future extension possibilities (not implemented)

Authentication, cloud sync, teacher/institution dashboards, leaderboards, remote evaluation, AI-based post-practice feedback, additional company-specific profiles.

## Testing checklist

- Home: navigation and stats render
- Topics: filters and Surprise me work; no immediate repeats
- Pre-writing: checklist gates the start button; profile pills update config
- Writing: timer counts down without drift; word count states update; autosave persists
- Refresh mid-session: recovery prompt appears; resume restores topic/text/time
- Timeout: input stops, "Time is up" dialog, review follows
- Submit: results, scorecard, signals, essay view render
- Progress: stats/charts/history update; delete and clear-all confirm
- Settings: preferences persist across reloads; theme/font apply immediately
