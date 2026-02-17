import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';

import { AppState } from '../../store/app.state';
import { TransactionsActions } from '../../store/transactions/transactions.actions';
import {
  selectAllTransactions,
  selectTransactionsLoading,
  selectTransactionsError,
  selectTransactionsPage,
  selectTransactionsPageSize,
  selectTransactionsTotalCount,
} from '../../store/transactions/transactions.selectors';
import { selectAllPortfolios } from '../../store/portfolios/portfolios.selectors';
import { PortfoliosActions } from '../../store/portfolios/portfolios.actions';

import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PnlColorPipe } from '../../shared/pipes/pnl-color.pipe';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorBannerComponent,
    EmptyStateComponent,
    CurrencyFormatPipe,
    PnlColorPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="transactions-page">
      <div class="page-header">
        <h1 class="page-title">Transactions</h1>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Portfolio</mat-label>
              <mat-select [(ngModel)]="portfolioId" (ngModelChange)="applyFilters()">
                <mat-option value="">All Portfolios</mat-option>
                @for (p of portfolios(); track p.id) {
                  <mat-option [value]="p.id">{{ p.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date From</mat-label>
              <input matInput [matDatepicker]="fromPicker" [(ngModel)]="dateFrom">
              <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
              <mat-datepicker #fromPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date To</mat-label>
              <input matInput [matDatepicker]="toPicker" [(ngModel)]="dateTo">
              <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
              <mat-datepicker #toPicker></mat-datepicker>
            </mat-form-field>

            <button mat-flat-button color="primary" (click)="applyFilters()">
              <mat-icon>filter_list</mat-icon> Apply
            </button>
            <button mat-stroked-button (click)="clearFilters()">
              <mat-icon>clear_all</mat-icon> Clear
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (error()) {
        <app-error-banner [message]="error()!" (retry)="reload()"></app-error-banner>
      }

      @if (loading()) {
        <app-loading-spinner message="Loading transactions..."></app-loading-spinner>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="transactions()" class="full-width">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let tx">
                {{ tx.date | date : 'mediumDate' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="symbol">
              <th mat-header-cell *matHeaderCellDef>Symbol</th>
              <td mat-cell *matCellDef="let tx">
                <span class="symbol-badge">{{ tx.symbol }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let tx" class="name-cell">{{ tx.name }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let tx">
                <span class="type-chip" [attr.data-type]="tx.type">{{ tx.type }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef class="text-right">Qty</th>
              <td mat-cell *matCellDef="let tx" class="text-right price-mono">
                {{ tx.quantity }}
              </td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef class="text-right">Price</th>
              <td mat-cell *matCellDef="let tx" class="text-right price-mono">
                {{ tx.price | currencyFormat }}
              </td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef class="text-right">Total</th>
              <td mat-cell *matCellDef="let tx" class="text-right price-mono">
                {{ tx.total | currencyFormat }}
              </td>
            </ng-container>

            <ng-container matColumnDef="fee">
              <th mat-header-cell *matHeaderCellDef class="text-right">Fee</th>
              <td mat-cell *matCellDef="let tx" class="text-right price-mono">
                {{ tx.fee | currencyFormat }}
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let tx">
                <span class="status-chip" [attr.data-status]="tx.status">
                  {{ tx.status }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td [attr.colspan]="displayedColumns.length" class="no-data">
                No transactions found.
              </td>
            </tr>
          </table>

          <!-- Server-side paginator -->
          <mat-paginator
            [length]="totalCount()"
            [pageSize]="pageSize()"
            [pageIndex]="page() - 1"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (page)="onPage($event)"
            showFirstLastButtons
          ></mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .transactions-page { max-width: 1400px; margin: 0 auto; }
    .page-header {
      display: flex; align-items: center; margin-bottom: 16px;
    }
    .page-title { margin: 0; font-size: 24px; font-weight: 600; }
    .filter-card { margin-bottom: 16px; }
    .filters {
      display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
    }

    .symbol-badge {
      background: rgba(92,107,192,.12); color: #5c6bc0;
      padding: 2px 8px; border-radius: 4px; font-weight: 600;
      font-size: 13px; font-family: 'Roboto Mono', monospace;
    }
    .name-cell {
      max-width: 160px; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
    }

    .type-chip {
      padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
      &[data-type="Buy"]      { background: rgba(102,187,106,.2); color: #2e7d32; }
      &[data-type="Sell"]     { background: rgba(239,83,80,.2);   color: #c62828; }
      &[data-type="Dividend"] { background: rgba(38,198,218,.2);  color: #00695c; }
      &[data-type="Transfer"] { background: rgba(255,167,38,.2);  color: #e65100; }
    }
    .status-chip {
      padding: 2px 10px; border-radius: 12px; font-size: 12px;
      &[data-status="Settled"]   { background: rgba(102,187,106,.15); color: #2e7d32; }
      &[data-status="Pending"]   { background: rgba(255,167,38,.15);  color: #e65100; }
      &[data-status="Cancelled"] { background: rgba(0,0,0,.08);       color: rgba(0,0,0,.54); }
    }

    .no-data { text-align: center; padding: 32px; color: rgba(0,0,0,.54); }
  `],
})
export class TransactionsComponent implements OnInit {
  private store = inject(Store<AppState>);

  loading      = toSignal(this.store.select(selectTransactionsLoading),    { initialValue: false });
  error        = toSignal(this.store.select(selectTransactionsError),      { initialValue: null });
  transactions = toSignal(this.store.select(selectAllTransactions),        { initialValue: [] });
  totalCount   = toSignal(this.store.select(selectTransactionsTotalCount), { initialValue: 0 });
  page         = toSignal(this.store.select(selectTransactionsPage),       { initialValue: 1 });
  pageSize     = toSignal(this.store.select(selectTransactionsPageSize),   { initialValue: 25 });
  portfolios   = toSignal(this.store.select(selectAllPortfolios),          { initialValue: [] });

  displayedColumns = ['date','symbol','name','type','quantity','price','total','fee','status'];

  portfolioId = '';
  dateFrom: Date | null = null;
  dateTo:   Date | null = null;

  ngOnInit(): void {
    this.store.dispatch(PortfoliosActions.loadPortfolios());
    this.reload();
  }

  reload(): void {
    this.store.dispatch(
      TransactionsActions.loadTransactions({
        page:     1,
        pageSize: this.pageSize(),
      })
    );
  }

  applyFilters(): void {
    this.store.dispatch(
      TransactionsActions.loadTransactions({
        portfolioId: this.portfolioId || undefined,
        page:        1,
        pageSize:    this.pageSize(),
        dateFrom:    this.dateFrom?.toISOString() ?? undefined,
        dateTo:      this.dateTo?.toISOString()   ?? undefined,
      })
    );
  }

  clearFilters(): void {
    this.portfolioId = '';
    this.dateFrom    = null;
    this.dateTo      = null;
    this.reload();
  }

  onPage(event: PageEvent): void {
    this.store.dispatch(
      TransactionsActions.loadTransactions({
        portfolioId: this.portfolioId || undefined,
        page:        event.pageIndex + 1,
        pageSize:    event.pageSize,
        dateFrom:    this.dateFrom?.toISOString() ?? undefined,
        dateTo:      this.dateTo?.toISOString()   ?? undefined,
      })
    );
  }
}
