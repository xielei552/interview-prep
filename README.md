# Angular 17 Investment Portfolio Manager

> Senior frontend developer interview showcase project demonstrating Angular 17, Angular Material, NgRx state management, and performance engineering for large datasets.

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Angular 17 (standalone components) |
| UI | Angular Material 17 + CDK |
| State | NgRx 17 (Store + Effects + Entity + Router) |
| Charts | ng2-charts 4 + Chart.js 4 |
| Mock API | json-server 0.17 + @faker-js/faker 9 |

---

## Quick Start

```bash
# 1. Install root deps (json-server, faker, concurrently)
npm install

# 2. Install Angular deps
cd portfolio-manager && npm install && cd ..

# 3. Start everything (seeds data, then runs API + app concurrently)
npm run dev
```

Open **http://localhost:4200**. Redux DevTools extension recommended.

### Individual commands

```bash
npm run seed    # Regenerate server/db.json (5 portfolios, 1000 positions, 10k transactions)
npm run api     # json-server on :3000 with 300ms simulated latency
npm run app     # ng serve on :4200 with /api proxy
npm run build   # Production build with bundle analysis
```

---

## Project Structure

```
interview-prep/
├── package.json                     # Root runner scripts
├── server/
│   ├── seed.js                      # Faker data generator (deterministic seed 42)
│   ├── db.json                      # Generated mock data (git-ignored)
│   └── routes.json                  # json-server route aliases
│
└── portfolio-manager/               # Angular 17 workspace
    ├── proxy.conf.json              # /api → http://localhost:3000
    └── src/app/
        ├── app.config.ts            # All providers (NgRx, HTTP interceptors, router)
        ├── app.routes.ts            # Lazy-loaded feature routes
        ├── app.component.ts         # Shell: sidenav + toolbar + dark mode toggle
        ├── core/
        │   ├── interceptors/        # auth, retry (exponential backoff), error
        │   ├── guards/              # portfolioGuard (CanActivateFn)
        │   ├── resolvers/           # portfolioDetailResolver (ResolveFn)
        │   └── services/            # PortfolioService, PositionService, TransactionService
        ├── shared/
        │   ├── components/          # KpiCard, LoadingSpinner, ErrorBanner, ConfirmDialog, EmptyState
        │   └── pipes/               # currencyFormat, percentFormat, pnlColor, largeNumber
        ├── store/
        │   ├── app.state.ts         # AppState + all model interfaces
        │   ├── portfolios/          # actions, reducer (EntityAdapter), effects, selectors
        │   ├── positions/           # actions, reducer (EntityAdapter), effects, selectors
        │   └── transactions/        # actions, reducer (EntityAdapter), effects, selectors
        └── features/
            ├── dashboard/           # KPI cards + allocation chart + top movers
            ├── portfolios/          # List + create/edit dialog
            ├── portfolio-detail/    # Performance chart + risk metrics + resolver
            ├── positions/           # CDK virtual scroll table + filter bar
            └── transactions/        # Paginated table + date range filter
```

---

## Senior-Level Patterns Demonstrated

### 1. CDK Virtual Scroll
`cdk-virtual-scroll-viewport` with a custom `DataSource<Position>` class — **not** `MatTableDataSource` (incompatible with virtual scroll). Only ~15 DOM rows rendered for 1000+ items.

```typescript
// positions-data-source.ts
export class PositionsDataSource extends DataSource<Position> {
  private _data$ = new BehaviorSubject<Position[]>([]);
  connect(): Observable<Position[]> { return this._data$.asObservable(); }
  setData(positions: Position[]): void { this._data$.next(positions); }
}
```

### 2. NgRx — Modern Patterns
- **`createActionGroup`** for all action groups (NgRx 14+ pattern)
- **`createEntityAdapter`** with `sortComparer` in all three feature reducers
- **Memoized selectors** — `selectFilteredPositions` composes filter + sort in one step
- **`exhaustMap`** for mutations (create/update/delete) to prevent duplicate requests
- **`switchMap`** for loads (cancels in-flight requests on re-trigger)
- **`{ dispatch: false }`** notification side-effects via `MatSnackBar`
- **CSV export** with `withLatestFrom(selectFilteredPositions)` + `URL.createObjectURL`

```typescript
// Derived selector example
export const selectFilteredPositions = createSelector(
  selectAllPositions,
  selectPositionFilters,
  (positions, filters) => {
    // filter by portfolioId, assetClass, full-text search
    // then sort by column/direction
    return result;
  }
);
```

### 3. Signals + Smart/Dumb Split
Smart containers inject `Store`, dispatch actions, use `toSignal()`. Dumb components use `@Input()`/`@Output()` only.

```typescript
// Smart container
loading = toSignal(this.store.select(selectPortfoliosLoading), { initialValue: false });
portfolios = toSignal(this.store.select(selectAllPortfolios), { initialValue: [] });
totalAUM = computed(() => this.portfolios().reduce((s, p) => s + p.totalValue, 0));
```

### 4. Angular 17 Control Flow
`@if`, `@for (track item.id)`, `@switch` replace `*ngIf`/`*ngFor`/`[ngSwitch]`.

```html
@if (loading()) {
  <app-loading-spinner></app-loading-spinner>
} @else if (portfolios().length === 0) {
  <app-empty-state title="No portfolios yet"></app-empty-state>
} @else {
  @for (p of portfolios(); track p.id) {
    <div class="row">{{ p.name }}</div>
  }
}
```

### 5. Functional Interceptors
`HttpInterceptorFn` via `withInterceptors()` — not the legacy `HTTP_INTERCEPTORS` token.

- **`authInterceptor`** — adds `Authorization: Bearer <token>` header
- **`retryInterceptor`** — exponential backoff (1s/2s/4s) for GET requests, skips 4xx
- **`errorInterceptor`** — normalizes errors, handles 401/403/network failures

```typescript
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') return next(req);
  return next(req).pipe(
    retry({
      count: 3,
      delay: (error, retryCount) => {
        if (error.status >= 400 && error.status < 500) return throwError(() => error);
        return timer(1000 * Math.pow(2, retryCount - 1));
      },
    })
  );
};
```

### 6. Route Guards + Resolvers
- `portfolioGuard` (`CanActivateFn`) — checks entity store before activating, dispatches load if needed
- `portfolioDetailResolver` (`ResolveFn<Portfolio>`) — waits for entity to be in store

### 7. Lazy-Loaded Feature Routes
Each feature is a separate JS chunk — only `dashboard.js` loads at startup.

```
Lazy chunk files
  transactions-component     103 kB
  portfolios-component        44 kB
  positions-component         14 kB
  portfolio-detail-component   6 kB
  dashboard-component          6 kB
```

### 8. Material Theme + Financial UX
- Custom palette: Indigo primary, Cyan accent
- `density: -1` for compact tables (critical for data-heavy UI)
- CSS custom properties: `--color-positive: #00c853`, `--color-negative: #f44336`
- `.price-mono` class: `font-variant-numeric: tabular-nums` for aligned financial digits
- Dark theme via `.dark-theme` class toggled by a `signal()` in `AppComponent`

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

---

## API (json-server)

The mock API auto-supports pagination, sorting, and filtering:

```bash
# Positions for a portfolio
GET /api/positions?portfolioId=p1

# Paginated + sorted transactions
GET /api/transactions?_page=1&_limit=25&_sort=date&_order=desc

# Full-text search
GET /api/positions?q=AAPL

# Date range
GET /api/transactions?date_gte=2024-01-01&date_lte=2024-12-31
```

---

## Verification

```bash
# Verify seed data
node server/seed.js
# Expected: Portfolios: 5, Positions: 1000, Transactions: 10000

# Verify API (after npm run api)
curl "http://localhost:3000/positions?portfolioId=p1&_limit=5" | python3 -m json.tool
curl "http://localhost:3000/transactions?_page=1&_limit=5&_sort=date&_order=desc"

# Production build
cd portfolio-manager && npx ng build --configuration production

# Performance checks (with app running)
# DevTools Elements: virtual scroll shows ~15 DOM rows for 1000 positions
# Redux DevTools: selector memoization (dispatch count vs recompute count)
# Network tab: only dashboard.js loads at startup (lazy routes)
# Kill json-server mid-request: observe 3 retry attempts in browser console
```
