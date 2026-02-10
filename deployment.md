# Deployment & Testing Guide

This guide provides step-by-step instructions for testing, building, and deploying the Retirement Planning Simulation app.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Testing Strategy](#testing-strategy)
4. [Building for Production](#building-for-production)
5. [Deployment Checklist](#deployment-checklist)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js**: v18 or higher (check with `node --version`)
- **pnpm**: v8 or higher (check with `pnpm --version`)
  - Install pnpm: `npm install -g pnpm`
- **Git**: for version control
- **Web Browser**: Modern browser with ES2020+ support (Chrome, Firefox, Safari, Edge)

### Architecture Notes
This app is a **local-only, client-side application**:
- No backend server required
- All data stored locally (browser localStorage or IndexedDB)
- No external API dependencies
- Single executable artifact (static HTML/CSS/JS)

---

## Local Development Setup

### Step 1: Install Dependencies

```bash
cd app
pnpm install
```

This installs all required packages specified in `package.json`. The lock file (`pnpm-lock.yaml`) ensures reproducible installs.

**Expected output:**
- Clean install with no warnings
- `node_modules/` directory created
- All peer dependencies resolved

### Step 2: Start Development Server

```bash
pnpm dev
```

This starts the Astro development server with hot module replacement (HMR).

**Expected output:**
```
  🚀  Ready in X.XXs

  ➜  Local   http://localhost:3000/
  ➜  Network use `--host` to access
```

Open http://localhost:3000/ in your browser. Changes to source files will automatically reload.

### Step 3: Verify Basic Functionality

1. **Check app loads**: Page should render without console errors
2. **Check console**: Open browser DevTools (F12) → Console tab
   - No red `[ERROR]` messages
   - No uncaught exceptions
3. **Verify functionality**: Navigate through key pages and interactions
   - Forms submit without errors
   - Data persists on page refresh
   - Charts/visualizations render correctly

---

## Testing Strategy

The test suite is organized into three levels:

### Level 1: Unit Tests
Test individual functions and components in isolation.

**Run all unit tests once:**
```bash
pnpm test
```

**Run in watch mode (recommended for development):**
```bash
pnpm test:watch
```

Watch mode reruns affected tests when files change. Press `q` to quit.

**Expected output:**
```
 ✓ tests/unit/... (X tests)
 Test Files  X passed (X)
 Tests       Y passed (Y)
```

**Key test locations:**
- `tests/unit/` — Unit tests for utilities, calculations, data models
- Each test file follows pattern: `*.test.ts` or `*.test.tsx`

### Level 2: Integration Tests
Test how modules work together (e.g., calculations + UI components).

**Run integration tests:**
```bash
pnpm test
```

Integration tests are located in `tests/integration/` and run alongside unit tests.

**Expected output:**
```
 ✓ tests/integration/... (X tests)
```

### Level 3: Scenario Tests (Spreadsheet Parity)
Verify app calculations match the authoritative Excel baseline.

**Run scenario tests:**
```bash
pnpm test:scenarios
```

This runs comprehensive scenarios that compare app output against `Retire-original.xlsx`.

**Expected scenarios:**
1. **Straight-through GS** — Standard GS employee, full career, no special cases
2. **LEO Early Retirement** — Law Enforcement Officer with early retirement eligibility
3. **Military Buyback** — Employee with military service credit buyback
4. **Roth vs Traditional TSP** — Comparison of TSP strategy options

**Expected output:**
```
 ✓ tests/scenarios/... (X scenarios)
 Scenario "Straight-through GS"     PASSED
 Scenario "LEO early retirement"    PASSED
 Scenario "Military buyback"        PASSED
 Scenario "Roth vs Traditional TSP" PASSED
```

### Running Specific Tests

**Run tests matching a pattern:**
```bash
pnpm test -- tests/unit/calculations
```

**Run a single test file:**
```bash
pnpm test -- tests/unit/models/pay.test.ts
```

**Run with coverage report:**
```bash
pnpm test -- --coverage
```

Coverage reports appear in `coverage/` directory with detailed HTML report at `coverage/index.html`.

---

## Type Checking

TypeScript type checking validates code without running it.

**Run type check:**
```bash
pnpm typecheck
```

**Expected output:**
```
No errors!
```

**Common error types:**
- Missing types on function parameters
- Type mismatches in calculations
- Undefined variables or properties

Fix errors before building for production.

---

## Building for Production

### Step 1: Type Check

```bash
pnpm typecheck
```

Ensure no TypeScript errors exist.

### Step 2: Run Full Test Suite

```bash
pnpm test
```

All unit, integration, and scenario tests must pass before building.

**If tests fail:**
1. Review test output for specific failures
2. Check test files in `tests/` directory
3. Fix source code issues
4. Re-run tests to verify

### Step 3: Build Production Bundle

```bash
pnpm build
```

This creates an optimized production build.

**Expected output:**
```
  ✓ built in X.XXs

  dist/
  ├── index.html
  ├── _astro/
  │   ├── *.js (minified JavaScript bundles)
  │   ├── *.css (minified stylesheets)
  │   └── *.woff2 (fonts)
  └── ...
```

**Build artifacts:**
- `dist/index.html` — Main entry point
- `dist/_astro/*.js` — Minified JavaScript bundles
- `dist/_astro/*.css` — Minified stylesheets
- `dist/public/*` — Static assets (images, fonts)

### Step 4: Verify Production Build

```bash
pnpm preview
```

This serves the production build locally for testing.

**Expected output:**
```
  ➜  Preview server running at http://localhost:4321/
```

**Verification checklist:**
- [ ] App loads at http://localhost:4321/
- [ ] All pages render correctly
- [ ] No console errors
- [ ] All interactions work (forms, navigation, calculations)
- [ ] Data persists on page refresh
- [ ] Charts and visualizations render properly
- [ ] Mobile responsive (test with F12 device emulation)

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass: `pnpm test && pnpm test:scenarios`
- [ ] Type check passes: `pnpm typecheck`
- [ ] Production build succeeds: `pnpm build`
- [ ] Preview build tested: `pnpm preview`
- [ ] No console errors in production preview
- [ ] Git working tree clean: `git status`
- [ ] Code reviewed or approved by team
- [ ] CHANGELOG updated with release notes
- [ ] Version bumped in `app/package.json` if applicable

### Deployment Target Options

#### Option A: Static Web Host (Recommended)
For services like Netlify, Vercel, GitHub Pages, or AWS S3:

1. Deploy contents of `dist/` directory
2. Ensure root file serves `index.html`
3. Configure HTTP headers:
   - Cache `_astro/*.js` and `_astro/*.css` for 1 year (has hash fingerprints)
   - Cache `index.html` for 5 minutes (changes frequently)
4. Test deployed version thoroughly

#### Option B: Local Server
For on-premises or custom deployment:

1. Copy `dist/` directory to server
2. Serve with web server (nginx, Apache, etc.)
3. Configure gzip compression for `.js`, `.css`, `.woff2` files
4. Set appropriate cache headers (see Option A)

#### Option C: Docker Container
For containerized deployments:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm build

# Runtime stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Post-Deployment

- [ ] Verify deployed site is accessible
- [ ] Check browser console for errors
- [ ] Test core functionality in production environment
- [ ] Verify local data storage works (localStorage, IndexedDB)
- [ ] Test on mobile devices
- [ ] Monitor for any reported issues

---

## Troubleshooting

### Common Issues

#### 1. Dependencies Won't Install
**Symptom:** `pnpm install` fails with error

**Solution:**
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 2. Tests Fail Unexpectedly
**Symptom:** `pnpm test` shows failures that pass locally

**Solution:**
```bash
# Restart test watcher
pnpm test:watch

# Run specific failing test
pnpm test -- tests/unit/path/to/test.test.ts --reporter=verbose

# Check for environment-specific issues
node --version
pnpm --version
```

#### 3. Build Succeeds But Production Doesn't Work
**Symptom:** `pnpm preview` shows errors or missing content

**Solution:**
1. Check browser console (F12) for specific errors
2. Verify all assets loaded correctly (Network tab)
3. Check that `dist/index.html` exists and is valid
4. Ensure CSS/JS bundles in `dist/_astro/` are not empty
5. Test in different browser to rule out caching issues

#### 4. Scenario Tests Fail (Spreadsheet Parity)
**Symptom:** `pnpm test:scenarios` shows calculated values don't match Excel baseline

**Solution:**
1. Check the specific scenario that failed in output
2. Review the calculation formula in source code
3. Compare against `Retire-original.xlsx` formula
4. Check `docs/formula-registry.md` for documented formula
5. Update fixture in `tests/scenarios/fixtures/baseline.json` if formula was intentionally changed
6. Add entry to `docs/spreadsheet-parity.md` discrepancy log if needed

#### 5. Development Server Won't Start
**Symptom:** `pnpm dev` shows error

**Solution:**
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Try again
pnpm dev
```

#### 6. TypeScript Errors Before Build
**Symptom:** `pnpm typecheck` shows errors but code seems fine

**Solution:**
```bash
# Regenerate TypeScript cache
rm -rf .astro tsconfig.json.tsbuildinfo

# Reinstall type definitions
pnpm install

# Type check again
pnpm typecheck
```

### Getting Help

1. **Check documentation:**
   - `CLAUDE.md` — Project guidelines and overview
   - `docs/architecture.md` — System architecture
   - `docs/formula-registry.md` — Calculation formulas
   - `content/docs/overview.md` — User-facing documentation

2. **Review test output:**
   - Run tests with verbose flag: `pnpm test -- --reporter=verbose`
   - Check specific error messages carefully

3. **Inspect source code:**
   - Look in `app/src/` for implementation
   - Check `app/tests/` for test examples

---

## Performance Optimization Notes

The production build includes:
- **Minification:** All JS/CSS reduced in size
- **Code splitting:** Large bundles split into chunks
- **Asset fingerprinting:** File hashes in names enable long-term caching
- **Tree shaking:** Unused code removed from bundles

No additional optimization is typically needed for deployment.

---

## Local Data & Privacy

All user data is stored locally:
- **Browser localStorage** — Small amounts of data (app settings, session state)
- **IndexedDB** — Larger data (retirement scenarios, historical calculations)
- **No cloud sync** — Data never leaves the user's device
- **No analytics** — No user tracking or external requests

Users can clear data anytime:
1. Browser DevTools → Application → Clear Storage
2. Or close browser and manually delete localStorage

---

## Version Control

Tag production releases in git:

```bash
git tag -a v0.1.0 -m "Release v0.1.0: Initial deployment"
git push origin v0.1.0
```

Update `CHANGELOG.md` with release notes before tagging.

---

## Support

For issues or questions:
- Review relevant documentation files listed above
- Check existing test cases for examples
- Consult CLAUDE.md for design principles and architecture
