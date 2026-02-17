# CLAUDE.md — Angular 17 Investment Portfolio Manager

This file documents the full implementation context, decisions, and step-by-step build order for this project. Use it to onboard Claude or any developer into the codebase instantly.

---

## Project Overview

Senior frontend developer interview showcase. Domain: Investment Portfolio Manager (stocks, bonds, ETFs). Mock REST API via json-server. All data is seeded — no real brokerage connection.

**Working directory:** `/Users/leixie/Workspace/interview-prep`
**Angular workspace:** `./portfolio-manager`
**Mock API data:** `./server/db.json` (git-ignored, regenerate with `npm run seed`)

---

## Stack Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Angular 17 (standalone) | Showcases @if/@for, signals, functional interceptors |
| UI | Angular Material 17 + CDK | Data tables, theming, virtual scroll |
| State | NgRx 17 (Store + Effects + Entity + Router) | Industry-standard; entity adapter = normalized state |
| Charts | ng2-charts@4 + Chart.js@4 | Lightweight; works with Angular 17 |
| Mock API | json-server@0.17.4 + @faker-js/faker@9 | Stable; auto-supports pagination/sort/filter |
| Angular CLI | `npx @angular/cli@17` (NOT global) | Prevents global CLI 21 from scaffolding Angular 21 |

---

## Data Models

```typescript
Portfolio  { id, name, description, currency, createdAt,
             totalValue, dailyPnL, dailyPnLPercent, ytdReturn, ytdReturnPercent }

Position   { id, portfolioId, symbol, name, assetClass, quantity, avgCost,
             currentPrice, marketValue, unrealizedPnL, unrealizedPnLPercent,
             weight, dayChange, dayChangePercent }

Transaction{ id, portfolioId, symbol, name, type, quantity, price,
             total, fee, date, status }
```

All interfaces live in `src/app/store/app.state.ts`.

---

## NgRx State Shape

```typescript
AppState {
  portfolios:   EntityState<Portfolio>   + loading + error + selectedId
  positions:    EntityState<Position>    + loading + error + filters + totalCount
  transactions: EntityState<Transaction> + loading + error + page + pageSize + totalCount + dateFrom + dateTo
  router:       RouterReducerState
}
```

---

## Scaffold Commands (reference — already run)

```bash
# 1. Create Angular 17 project
cd /Users/leixie/Workspace/interview-prep
npx @angular/cli@17 new portfolio-manager --routing --style=scss --standalone --skip-git --prefix=app

# 2. Add Angular Material
cd portfolio-manager
npx @angular/cli@17 add @angular/material@17 --theme=custom --typography --animations=enabled

# 3. Install NgRx 17
npm install @ngrx/store@17 @ngrx/effects@17 @ngrx/entity@17 @ngrx/router-store@17 @ngrx/store-devtools@17 @ngrx/schematics@17 --save-exact

# 4. Install charts
npm install ng2-charts@4.1.1 chart.js@4.5.1 --save-exact

# 5. Install ESLint
npx @angular/cli@17 add @angular-eslint/schematics@17

# 6. Root runner (back in interview-prep/)
cd ..
npm init -y
npm install json-server@0.17.4 @faker-js/faker@9.9.0 concurrently@9.2.1 --save-dev
```

---

## Implementation Steps (Build Order)

### Phase 1 — Foundation

**Step 1: Run scaffold commands**
Run the commands above in order. Use `npx @angular/cli@17` explicitly — never the global CLI.

**Step 2: Seed data**
- Write `server/seed.js` — uses `faker.seed(42)` for deterministic output
- Generates: 5 portfolios, 200 positions each (1000 total), 10,000 transactions
- Uses real ticker pool (AAPL, MSFT, SPY, TLT, BTC-USD, etc.) + synthetic tickers
- Run: `node server/seed.js` → outputs `server/db.json`
- Add `server/db.json` to `.gitignore`

**Step 3: Configure root package.json**
- Set `"type": "module"` (required for ES module seed script)
- Scripts: `seed`, `api`, `app`, `dev` (seed + concurrently), `build`
- `npm run dev` = seeds data then starts json-server + ng serve in parallel

**Step 4: Write server/routes.json**
```json
{
  "/api/*": "/$1",
  "/portfolios/:id/positions": "/positions?portfolioId=:id",
  "/portfolios/:id/transactions": "/transactions?portfolioId=:id"
}
```

**Step 5: Create proxy.conf.json**
```json
{ "/api": { "target": "http://localhost:3000", "pathRewrite": { "^/api": "" } } }
```
Located at `portfolio-manager/proxy.conf.json`. Referenced in `npm run app` via `--proxy-config`.

**Step 6: Configure Material theme (styles.scss)**
- Custom palette: `$indigo-palette` primary, `$cyan-palette` accent
- `density: -1` for compact tables
- Define a second dark theme (`mat.define-dark-theme`) applied via `.dark-theme` class
- CSS custom properties: `--color-positive: #00c853`, `--color-negative: #f44336`
- `.price-mono` class: `font-variant-numeric: tabular-nums` for aligned financial digits

**Step 7: Define AppState interfaces (store/app.state.ts)**
- All domain model interfaces: `Portfolio`, `Position`, `Transaction`
- Feature state shapes: `PortfolioFeatureState`, `PositionFeatureState`, `TransactionFeatureState`
- `PositionFilters` interface for filter state
- Root `AppState` interface

**Step 8: Wire app.config.ts**
```typescript
provideRouter(APP_ROUTES, withRouterConfig({ paramsInheritanceStrategy: 'always' }))
provideAnimations()
provideHttpClient(withInterceptors([authInterceptor, retryInterceptor, errorInterceptor]))
provideStore({ portfolios, positions, transactions })
provideEffects([PortfoliosEffects, PositionsEffects, TransactionsEffects])
provideRouterStore()
provideStoreDevtools({ maxAge: 50, logOnly: !isDevMode(), connectInZone: true })
```
Note: use `provideAnimations()` not `provideAnimationsAsync()`.

**Step 9: Define lazy-loaded routes (app.routes.ts)**
Each feature uses `loadComponent` pointing to a default-export component. Apply `portfolioGuard` to routes that need portfolios pre-loaded. Apply `portfolioDetailResolver` to the detail route.

**Step 10: Implement AppComponent shell**
- Signal-based local state: `isDark = signal(false)`, `sidenavOpen = signal(false)`
- `isHandset` via `toSignal(BreakpointObserver.observe(Breakpoints.Handset))`
- `ChangeDetectionStrategy.OnPush`
- Sidenav: `mode="over"` on handset, `mode="side"` on desktop
- Toolbar: hamburger on handset, dark mode toggle always visible
- Dark mode: toggles `.dark-theme` class on wrapper `<div>`

---

### Phase 2 — Core Infrastructure

**Step 11: auth.interceptor.ts** (`HttpInterceptorFn`)
Clones request and sets `Authorization: Bearer <token>` header.

**Step 12: retry.interceptor.ts** (`HttpInterceptorFn`)
- GET requests only (skip mutations)
- Uses RxJS `retry()` with `delay` callback for exponential backoff: 1s, 2s, 4s
- Skips retry for 4xx responses (`throwError` immediately)
- Logs retry attempts to console

**Step 13: error.interceptor.ts** (`HttpInterceptorFn`)
- `catchError` normalizes all HTTP errors to `AppError { status, message, url }`
- Handles 401, 403, status 0 (network error) with specific messages
- Logs to console

**Step 14: PortfolioService**
CRUD methods against `/api/portfolios`: `getAll()`, `getById()`, `create()`, `update()`, `delete()`.

**Step 15: PositionService**
`getAll(portfolioId?)` — returns all positions, optionally filtered by portfolio.

**Step 16: TransactionService**
`getPage(params)` — server-side pagination. Uses `observe: 'response'` to read `X-Total-Count` header from json-server. Returns `{ data, totalCount }`.

**Step 17: Pipes (all standalone)**
- `CurrencyFormatPipe` — `Intl.NumberFormat` + compact mode (K/M/B)
- `PercentFormatPipe` — fixed decimals + optional `+` prefix
- `PnlColorPipe` — returns CSS class string: `pnl-positive` / `pnl-negative` / `pnl-neutral`
- `LargeNumberPipe` — K/M/B shorthand without currency symbol

**Step 18: Shared dumb components (all standalone, OnPush)**
- `KpiCardComponent` — label, value, change, changePercent, icon, iconColor
- `LoadingSpinnerComponent` — `mat-spinner` + optional message
- `ErrorBannerComponent` — error message + optional retry `EventEmitter`
- `ConfirmDialogComponent` — `MAT_DIALOG_DATA` injected, returns boolean
- `EmptyStateComponent` — icon, title, subtitle + `ng-content` slot

---

### Phase 3 — NgRx Store

**Step 19: Portfolios feature slice**

*actions.ts* — `createActionGroup` with source `'Portfolios'`:
- Load many: `loadPortfolios`, `loadPortfoliosSuccess`, `loadPortfoliosFailure`
- Load one: `loadPortfolio`, `loadPortfolioSuccess`, `loadPortfolioFailure`
- Select: `selectPortfolio`
- CRUD: create/update/delete (each with Success/Failure variants)

*reducer.ts* — `createEntityAdapter<Portfolio>` with `sortComparer: (a, b) => b.totalValue - a.totalValue`. Handles all action variants.

*selectors.ts* — `createFeatureSelector('portfolios')` then `adapter.getSelectors()`. Derived selectors:
- `selectTotalAUM` — sum of all `totalValue`
- `selectTotalDailyPnL` — sum of all `dailyPnL`
- `selectAllocationByPortfolio` — `{ label, value }[]` for chart
- `selectTopPortfoliosByReturn` — top 5 by `ytdReturnPercent`

*effects.ts*:
- `loadPortfolios$` → `switchMap` → `PortfolioService.getAll()`
- `loadPortfolio$` → `switchMap`
- `createPortfolio$` → `exhaustMap` (prevents duplicate submits)
- `updatePortfolio$` → `exhaustMap`
- `deletePortfolio$` → `exhaustMap`
- Notification effects (`{ dispatch: false }`) via `MatSnackBar` `tap` for Success and Failure actions

**Step 20: Positions feature slice**

*actions.ts* — `createActionGroup` with source `'Positions'`:
- `loadPositions(portfolioId?)`, success/failure
- `setFilters(filters)`, `resetFilters`
- `exportCSV`, `exportCSVSuccess`, `exportCSVFailure`

Note: NgRx `createActionGroup` capitalizes acronyms — `'Export CSV'` becomes `exportCSV` (not `exportCsv`).

*reducer.ts* — `createEntityAdapter<Position>` sorted by `b.marketValue - a.marketValue`. Stores `filters: PositionFilters` alongside entity state.

*selectors.ts* — Most complex selector: `selectFilteredPositions` composes portfolio filter + asset class filter + full-text search (symbol/name) + sort in one memoized selector.

*effects.ts*:
- `loadPositions$` → `switchMap`
- `exportCsv$` → `withLatestFrom(selectFilteredPositions)` → builds CSV → `URL.createObjectURL` → programmatic click → `{ dispatch: false }`

**Step 21: Transactions feature slice**

*actions.ts* — `loadTransactions` takes `{ portfolioId?, page, pageSize, dateFrom?, dateTo? }`.

*reducer.ts* — sorted by date descending. Stores `page`, `pageSize`, `totalCount`, `dateFrom`, `dateTo`.

*effects.ts*:
- `loadTransactions$` → `switchMap` → `TransactionService.getPage()`
- `reloadOnPageChange$` — listens to `setPage`, `setPageSize`, `setDateRange` → `withLatestFrom` current params → dispatches `loadTransactions`
- When passing `string | null` from store to action props typed `string | undefined`, use `value ?? undefined`

---

### Phase 4 — Feature Components

**Step 22: Dashboard**
Smart container. Dispatches `loadPortfolios` + `loadPositions` on `ngOnInit`. Uses `toSignal()` for all store selectors. `computed()` for `portfolioCount` and `chartData`. Doughnut chart (ng2-charts) for allocation. Top movers list from `selectTopMovers`.

**Step 23: Portfolios list**
Smart container. Table with `mat-table`. Opens `PortfolioDialogComponent` (via `MatDialog`) for create/edit. Opens `ConfirmDialogComponent` for delete. Dispatches appropriate NgRx actions on dialog close (filter with `filter(Boolean)` to skip cancel).

**Step 24: Portfolio Detail**
Gets `portfolio` from route resolver: `this.route.snapshot.data['portfolio']`. Loads positions for that portfolio on init. Uses `computed()` to filter `allPositions` by `portfolioId`. Bar chart for asset class breakdown.

**Step 25: Positions table (most complex)**

Two-part implementation:

*positions-data-source.ts* — Custom `DataSource<Position>` extending CDK `DataSource`:
```typescript
export class PositionsDataSource extends DataSource<Position> {
  private _data$ = new BehaviorSubject<Position[]>([]);
  connect(): Observable<Position[]> { return this._data$.asObservable(); }
  disconnect(): void { ... }
  setData(positions: Position[]): void { this._data$.next(positions); }
}
```
Do NOT use `MatTableDataSource` — it's incompatible with `cdk-virtual-scroll-viewport`.

*positions-table.component.ts* — Dumb component. Receives `positions: Position[]` via `@Input set`. Uses `cdk-virtual-scroll-viewport` with `[itemSize]="48"`. Two separate `<table mat-table>` elements: one for the sticky header (outside viewport), one for the body rows (inside viewport). Header rows in the body table are `display:none`.

*positions.component.ts* — Smart container. Search input debounced 300ms via `Subject` + `debounceTime` + `takeUntilDestroyed`. Dispatches `setFilters` on change. Portfolio and asset class dropdowns dispatch `setFilters` directly.

**Step 26: Transactions**
Smart container. Server-side pagination via `MatPaginator` (`(page)` event → dispatch `loadTransactions` with new page/pageSize). Date range via `MatDatepicker`. Imports `DatePipe` from `@angular/common` (standalone — must be explicit import). Status and type colored via attribute-based SCSS (`.type-chip[data-type="Buy"]`).

---

### Phase 5 — Polish

**Step 27: Dark mode**
Already wired in `AppComponent`. `.dark-theme` class on root wrapper `<div>` applies `mat.all-component-colors($dark-theme)` from `styles.scss`. Signal `isDark` toggled by toolbar button.

**Step 28: Responsive layout**
`BreakpointObserver.observe(Breakpoints.Handset)` → `toSignal()` → `isHandset`. Drives sidenav `mode` (`'side'` vs `'over'`) and hamburger visibility. CSS grid `auto-fit` in KPI and chart rows handles the rest.

**Step 29: Route animations**
`core/animations/route.animations.ts` — `trigger('routeAnimations')` with opacity fade. Wire to `<router-outlet>` in `AppComponent` if desired.

**Step 30: Production build verification**
```bash
cd portfolio-manager && npx ng build --configuration production
```
Expected output: 5 named lazy chunks (`dashboard-component`, `portfolios-component`, `positions-component`, `portfolio-detail-component`, `transactions-component`). Zero TypeScript errors.

---

## Known Gotchas & Fixes

| Issue | Fix |
|---|---|
| `createActionGroup` capitalizes acronyms | `'Export CSV'` → `exportCSV`, not `exportCsv` |
| `provideAnimationsAsync` causes Material issues | Use `provideAnimations()` instead |
| `MatTableDataSource` breaks virtual scroll | Use custom `DataSource<T>` extending CDK `DataSource` |
| `string \| null` not assignable to `string \| undefined` | Use `value ?? undefined` when passing store selectors to action props |
| `DatePipe` not found in standalone component | Import `DatePipe` from `@angular/common` explicitly |
| `--typography=true` flag fails on `ng add @angular/material` | Use `--typography` (boolean flag, no value) |
| Budget warning on initial build | Bump `maximumWarning` to `1mb` in `angular.json` budgets |

---

## File Map (Critical Files)

| File | Purpose |
|---|---|
| `server/seed.js` | Generates all mock data — run before `npm run api` |
| `server/routes.json` | json-server `/api/*` aliasing |
| `portfolio-manager/proxy.conf.json` | Proxies `/api/*` → `http://localhost:3000` |
| `src/app/app.config.ts` | All NgRx + HTTP + router providers |
| `src/app/app.routes.ts` | Lazy-loaded feature routes |
| `src/app/store/app.state.ts` | All model interfaces + state shape |
| `src/app/store/portfolios/portfolios.selectors.ts` | `selectTotalAUM`, `selectAllocationByPortfolio` |
| `src/app/store/positions/positions.selectors.ts` | `selectFilteredPositions` (most complex) |
| `src/app/store/positions/positions.effects.ts` | CSV export with `withLatestFrom` |
| `src/app/features/positions/positions-table/positions-data-source.ts` | Custom CDK DataSource |
| `src/app/features/positions/positions-table/positions-table.component.ts` | CDK virtual scroll table |
| `src/styles.scss` | Material theme + dark mode + CSS custom properties |

---

## Running the Project

```bash
# Full dev stack (seeds + api + app)
npm run dev

# Individual
npm run seed    # Regenerate server/db.json
npm run api     # json-server on :3000 (300ms simulated delay)
npm run app     # ng serve on :4200

# Production build
npm run build
```

App: http://localhost:4200
API: http://localhost:3000
Redux DevTools: install browser extension for NgRx state inspection
