import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppState, AssetClass } from '../../store/app.state';
import { PositionsActions } from '../../store/positions/positions.actions';
import {
  selectFilteredPositions,
  selectPositionFilters,
  selectPositionsLoading,
  selectPositionsError,
} from '../../store/positions/positions.selectors';
import { selectAllPortfolios } from '../../store/portfolios/portfolios.selectors';
import { PortfoliosActions } from '../../store/portfolios/portfolios.actions';

import { PositionsTableComponent } from './positions-table/positions-table.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-positions',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    PositionsTableComponent,
    LoadingSpinnerComponent,
    ErrorBannerComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="positions-page">
      <div class="page-header">
        <h1 class="page-title">Positions</h1>
        <button
          mat-flat-button
          color="accent"
          (click)="exportCsv()"
          matTooltip="Export filtered positions to CSV"
        >
          <mat-icon>download</mat-icon> Export CSV
        </button>
      </div>

      <!-- Filter bar -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search symbol or name</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input
                matInput
                [(ngModel)]="searchValue"
                (ngModelChange)="onSearchChange($event)"
                placeholder="AAPL, Apple..."
              >
              @if (searchValue) {
                <button matSuffix mat-icon-button (click)="clearSearch()">
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Portfolio</mat-label>
              <mat-select [(ngModel)]="selectedPortfolioId" (ngModelChange)="onPortfolioChange($event)">
                <mat-option value="">All Portfolios</mat-option>
                @for (p of portfolios(); track p.id) {
                  <mat-option [value]="p.id">{{ p.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Asset Class</mat-label>
              <mat-select [(ngModel)]="selectedAssetClass" (ngModelChange)="onAssetClassChange($event)">
                <mat-option value="">All Classes</mat-option>
                <mat-option value="Stock">Stock</mat-option>
                <mat-option value="ETF">ETF</mat-option>
                <mat-option value="Bond">Bond</mat-option>
                <mat-option value="Crypto">Crypto</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button (click)="resetFilters()">
              <mat-icon>clear_all</mat-icon> Reset
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (error()) {
        <app-error-banner [message]="error()!" (retry)="reload()"></app-error-banner>
      }

      @if (loading()) {
        <app-loading-spinner message="Loading positions..."></app-loading-spinner>
      } @else if (filteredPositions().length === 0) {
        <app-empty-state
          icon="search_off"
          title="No positions found"
          subtitle="Try adjusting your filters"
        ></app-empty-state>
      } @else {
        <app-positions-table
          [positions]="filteredPositions()"
        ></app-positions-table>
      }
    </div>
  `,
  styles: [`
    .positions-page { max-width: 1600px; margin: 0 auto; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .page-title { margin: 0; font-size: 24px; font-weight: 600; }
    .filter-card { margin-bottom: 16px; }
    .filters {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-field { flex: 1; min-width: 240px; }
  `],
})
export class PositionsComponent implements OnInit {
  private store = inject(Store<AppState>);

  loading          = toSignal(this.store.select(selectPositionsLoading),  { initialValue: false });
  error            = toSignal(this.store.select(selectPositionsError),    { initialValue: null });
  filteredPositions = toSignal(this.store.select(selectFilteredPositions), { initialValue: [] });
  portfolios       = toSignal(this.store.select(selectAllPortfolios),     { initialValue: [] });

  // Local signal for search debounce
  searchValue         = '';
  selectedPortfolioId = '';
  selectedAssetClass  = '';

  private search$ = new Subject<string>();

  constructor() {
    // Debounce search input
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((search) => {
        this.store.dispatch(PositionsActions.setFilters({ filters: { search } }));
      });
  }

  ngOnInit(): void {
    this.store.dispatch(PortfoliosActions.loadPortfolios());
    this.reload();
  }

  reload(): void {
    this.store.dispatch(PositionsActions.loadPositions({}));
  }

  onSearchChange(value: string): void {
    this.search$.next(value);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.search$.next('');
  }

  onPortfolioChange(portfolioId: string): void {
    this.store.dispatch(PositionsActions.setFilters({ filters: { portfolioId } }));
  }

  onAssetClassChange(assetClass: AssetClass | ''): void {
    this.store.dispatch(PositionsActions.setFilters({ filters: { assetClass } }));
  }

  resetFilters(): void {
    this.searchValue         = '';
    this.selectedPortfolioId = '';
    this.selectedAssetClass  = '';
    this.store.dispatch(PositionsActions.resetFilters());
  }

  exportCsv(): void {
    this.store.dispatch(PositionsActions.exportCSV());
  }
}
