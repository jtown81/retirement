# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fishing tournament management application replacing an Excel/VBA-based system. The XLSM spreadsheet (`Fishing Tourney 2024- ChatGPT Upload.xlsm`) was used as the starting reference for the data model, formulas, and workflows. It will become obsolete as the application is built -- the app is the source of truth, not the spreadsheet. See `roadmap.md` for full architecture, data model, phased delivery plan, and technology decisions.

## Current Status

**Phase 2 Complete** (100%). Fully functional PWA with tournament data entry, statistics, live scoreboard, reporting, and print suite. All core calculations implemented and tested.

**Phase 1 (Data Entry)**: Tournament setup, team/member management, weigh-in capture (Day 1 & 2), with calculations for day totals (`raw_weight + 0.20 * fish_released`) and grand totals. Local IndexedDB storage with Dexie.js.

**Phase 2 (Analytics & Reporting)**:
- Statistics engine with 19 unit tests (core stats, enhanced stats, distribution analysis, most improved, big fish tracking)
- Dashboard with 5 Recharts visualizations (weight distribution, day comparison scatter, big fish leaderboard, most improved report, summary cards)
- Calcutta manager (Fisher-Yates shuffle group generation, buyer/amount tracking, scoring)
- Live scoreboard (full-screen projector display with standings & metrics, auto-refresh, dark theme)
- Parks & Wildlife report (agency submission CSV export with participation, harvest, weight metrics)
- Print suite (weight tickets 2/page, standings report, statistics report; safe DOM-based printing)

**Phase 3+ (Future)**: Cloud sync, multi-year analytics, historical data import, mobile enhancements, subscription tier management

## Python Environment

pyenv is configured at the project root with Python 3.12.8. Always use pyenv:
```bash
export PYENV_ROOT="$HOME/.pyenv" && export PATH="$PYENV_ROOT/bin:$PATH" && eval "$(pyenv init -)"
```

The `openpyxl` package is installed for reading XLSM files.

## Tech Stack (Implemented)

**Core**: React 19 + TypeScript 5 (strict) + Vite + Tailwind CSS 4 + shadcn/ui + Lucide icons

**Storage & State**: IndexedDB via Dexie.js (offline-first) + Zustand for client state management

**UI & Visualization**: Recharts 3 (bar/scatter/area charts), TanStack Table (sortable grids), shadcn/ui primitives

**Build & Test**: Vite (dev server, HMR), Vitest 3 (unit tests), TypeScript strict mode

**PWA**: Service workers for offline functionality, manifest.json, installable on mobile devices

**Future Integrations**: SheetJS for XLSM import (Phase 3+)

## Build & Development Commands

All commands run from the project root:

```bash
npm install                    # Install dependencies
npm run dev                    # Dev server (http://localhost:5173)
npm run build                  # Production build
npm run preview               # Preview production build locally
npm run test                  # Run all unit tests once
npm run test:watch           # Run tests in watch mode
npm run typecheck            # TypeScript strict check (no emit)
```

## Project Structure

```
src/
  models/
    tournament.ts            -- Team, Tournament, WeighIn, TeamStanding types
    index.ts                 -- Barrel exports
  modules/
    stats/                   -- Statistics engine (core & enhanced stats, distributions)
    calcutta/                -- Calcutta group generation & scoring
    reports/                 -- Parks & Wildlife report generator
  components/
    layout/                  -- AppShell, Header, Sidebar, navigation
    dashboard/               -- Dashboard container component
    charts/                  -- StatsSummaryCards, WeightDistributionChart, DayComparisonChart, BigFishLeaderboard, MostImprovedReport, StatisticsOverview
    calcutta/                -- CalcuttaManager, GroupGenerator, GroupsList, Results
    scoreboard/              -- ScoreboardDisplay (fullscreen), MiniScoreboard
    weigh-in/                -- WeighInForm (Day 1 & 2 data capture)
    forms/                   -- TournamentSetup, TeamList
    teams/                   -- Team CRUD
    print/                   -- PrintManager, StandingsPrint, WeightTicket
    reports/                 -- ParksReportGenerator
  hooks/
    useStandings.ts          -- Computed standings from weigh-ins
    useLocalStorage.ts       -- Persistent state management
  store/
    tournament-store.ts      -- Zustand store (tournaments, current tournament)
    team-store.ts            -- Team management
    weigh-in-store.ts        -- Weigh-in data storage
    calcutta-store.ts        -- Calcutta group/buyer state
  utils/
    formatting.ts            -- formatWeight, formatNumber, formatPercent, formatDate
    print.ts                 -- printContent, printById (safe DOM-based printing)
    calculations.ts          -- Day total, grand total formulas
  App.tsx                     -- Main app with view routing
  index.css                   -- Tailwind directives
```

## Key Module Boundaries

**Tournament Store** (`store/tournament-store.ts`):
- Manages list of tournaments and current tournament selection
- Single source of truth for tournament metadata

**Team & Weigh-In Stores** (`store/team-store.ts`, `store/weigh-in-store.ts`):
- Team members and team creation
- Weigh-in records (Day 1 & Day 2) with raw weights and fish release counts

**Statistics Engine** (`modules/stats/`):
- Pure functions (no React): `computeCoreStats()`, `computeEnhancedStats()`, `computeWeightDistribution()`, `computeMostImproved()`, `scoreCalcuttaGroups()`
- Hook: `useTournamentStats()` memoizes all stats computations
- Returns `CoreStats` (avg day 1/2, big fish, total caught/released), `EnhancedStats` (stdev, median, percentiles), `WeightBucket[]`, `MostImprovedTeam[]`

**Calcutta Engine** (`modules/calcutta/`):
- `generateCalcuttaGroups()`: Fisher-Yates shuffle into 3 or 4 member groups
- `updateGroupBuyer()`: Associate buyer name and amount per group
- `scoreCalcuttaGroups()`: Identify winning group (best grand total) and payout calculations
- Store: `calcutta-store.ts` manages UI state

**Reports** (`modules/reports/`):
- `generateParksReport()`: Assembles participation, harvest, weight, conservation metrics
- `exportParksReportCSV()`: Formats for agency submission

**Hooks & Computed State**:
- `useStandings()`: Computed from weigh-ins; returns sorted `TeamStanding[]` with rank changes
- `useTournamentStats()`: Memoized stats computation from standings

## Calculation Formulas

All formulas match the XLSM baseline:

- **Day Total**: `raw_weight + (fish_released * 0.20)` — bonus per released fish
- **Grand Total**: `day1_total + day2_total`
- **Average Weight Day N**: Sum of day N totals / number of teams (ignores zero-weight no-shows)
- **Standard Deviation**: Population stdev (STDEV.P) for tournament-wide variance
- **Big Fish Day N**: Maximum individual fish weight across all teams for that day
- **Rank Change**: Day 1 rank minus Day 2 rank (positive = improved)
- **Calcutta Payout**: Based on group's best team's grand total (configurable per tournament rules)

## Key Domain Concepts

- **2-day tournament**: Teams fish Day 1 and Day 2; standings combine both days
- **Day Total formula**: `raw_weight + (fish_released * 0.20)` -- the 0.20 lb bonus per released fish is a core rule
- **Grand Total**: `day1_total + day2_total`
- **Calcutta**: Auction-style side pool where teams are grouped (3 or 4 per group) and sold to buyers; the group with the best-performing team wins
- **Most Improved**: Rank change from Day 1 standing to Day 2 standing (positive = improved)
- **Weight Ticket**: Printed receipt for each team's weigh-in, two per page
- **Team**: Always 2 members, identified by team number (1-80+)
- **Stats**: Cross-year statistics including averages, standard deviations (population), big fish records, total caught/released

## XLSM Reference (Legacy)

The XLSM files served as the reference baseline for the data model and all formulas. The app is now the source of truth; the spreadsheets will eventually be obsolete. Historical files remain in the repo for:
- One-time historical data import (Phase 3+)
- Validation of calculation accuracy during initial launch
- Reference for complex rules (e.g., Calcutta auction methodology)

Key sheets that informed app design: Control Page (standings schema), Stats (cross-year formulas & big fish tracking), Ticket (print layout), Calcutta (group auction rules), Most Improved (rank delta tracking).

## Non-Negotiable Requirements

- **Offline-first**: App must function with zero network connectivity at tournament sites
- **Calculation accuracy**: Formulas derived from the XLSM must produce correct results; verify against historical data during initial import
- **Local storage**: All data persisted in IndexedDB; cloud sync is optional (Phase 3+)
- **Printable outputs**: Weight tickets and reports must print cleanly
- **Type safety**: All code must pass `npm run typecheck` (TypeScript strict mode)

## Import Path Aliases

Configured in `vite.config.ts` and `vitest.config.ts`:

| Alias | Path |
|-------|------|
| `@models/*` | `src/models/*` |
| `@modules/*` | `src/modules/*` |
| `@utils/*` | `src/utils/*` |
| `@store/*` | `src/store/*` |
| `@hooks/*` | `src/hooks/*` |
| `@components/*` | `src/components/*` |

Always import from barrel exports: `import { useTournamentStats } from '@modules/stats'` (not `@modules/stats/use-stats.ts`)

## Zustand Store Patterns

All stores follow this pattern:

```typescript
// src/store/my-store.ts
import { create } from 'zustand'

interface MyState {
  data: any[]
  selectedId: string | null
  setData: (data: any[]) => void
  setSelectedId: (id: string) => void
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  selectedId: null,
  setData: (data) => set({ data }),
  setSelectedId: (selectedId) => set({ selectedId })
}))

// In components:
const { data, selectedId, setData } = useMyStore()
```

## Testing Approach

- **Unit tests** in `src/modules/*/` use Vitest
- **Pure functions first**: Stats engine, calculations, and algorithms should have zero React deps for testability
- **Hooks tested indirectly** via component integration; avoid testing hooks in isolation
- **No snapshot tests** — verify actual calculation outputs
- Run `npm run test:watch` during development

Example from stats engine:
```typescript
const stats = computeCoreStats(weighIns, standings)
expect(stats.avgDay1Weight).toBe(expectedValue)
```

## Common Patterns

**Computed Values from Store**:
```typescript
const standings = useStandings()  // Memoized from weigh-in store
const stats = useTournamentStats()  // Memoized stats derived from standings
```

**Safe Printing**:
```typescript
import { printContent } from '@utils/print'
const printRef = useRef<HTMLDivElement>(null)
const handlePrint = () => {
  if (printRef.current) {
    printContent(printRef.current, 'Report Title')
  }
}
// Use ref={printRef} style={{ display: 'none' }} on container
```

**Formatting Values for Display**:
```typescript
import { formatWeight, formatNumber, formatPercent } from '@utils/formatting'
formatWeight(12.5)      // "12.5 lbs"
formatNumber(1000)      // "1,000"
formatPercent(0.75)     // "75%"
```

## Development Utilities

### Historical Test Data Seeding

**Location**: `src/db/seed/history-seeder.ts` and `src/utils/dev-seed.ts`

In **development mode only**, historical tournament data (2016-2022) can be loaded for testing via browser console:

```javascript
// In browser DevTools console (development mode only):
window.__seedHistoricalData()    // Load 7 years of realistic test data
window.__clearHistoricalData()   // Clear all historical tournaments
```

**Seed Data Includes**:
- 7 tournaments (2016-2022) with "HPA Annual Tournament" naming
- 2-6 teams per tournament with realistic catches
- Day 1 and Day 2 weigh-in records (fish count, weight, released, big fish)
- All calculated fields (day totals, grand totals)
- Records marked as "seeded" to distinguish from real tournament data

**Use Case**: Testing statistics, reports, multi-year analytics, and verifying calculations work correctly with historical data.

**Note**: XLSM import was removed as a user-facing feature. CSV import/export is the standard format. This seeding utility is development-only.

## Phase 4+ Roadmap

**Phase 4: Cloud Sync & Multi-Device** (Weeks 11-16)
- [ ] Supabase backend (PostgreSQL, auth, realtime)
- [ ] Offline-first sync engine (local-first with background cloud sync)
- [ ] Multi-device weigh-in stations syncing to single tournament
- [ ] Spectator mode with public read-only link

**Phase 5: Subscription & Multi-Tenant** (Weeks 17-24)
- [ ] User authentication and subscription billing (Stripe)
- [ ] Free tier (1 tournament local), Pro tier (cloud sync), Organization tier (multi-user)
- [ ] White-label branding support
- [ ] Native iOS/Android apps (Capacitor wrapper)

**Phase 6: Advanced Features** (Ongoing)
- [ ] Photo capture for weigh-in records
- [ ] GPS integration for fishing location tracking
- [ ] Angler profiles with multi-tournament statistics
- [ ] Species-specific tournament support
- [ ] Social media sharing
- [ ] Push notifications
- [ ] AI-powered predictions and weather correlation
- [ ] Sponsor management

Each phase will be handled with explicit planning before implementation.
