import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { AppState, Portfolio } from '../../store/app.state';
import { PortfoliosActions } from '../../store/portfolios/portfolios.actions';
import {
  selectAllPortfolios,
  selectPortfoliosLoading,
  selectPortfoliosError,
  selectTotalAUM,
} from '../../store/portfolios/portfolios.selectors';

import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorBannerComponent } from '../../shared/components/error-banner/error-banner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  PortfolioDialogComponent,
  PortfolioDialogData,
} from './portfolio-dialog/portfolio-dialog.component';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../shared/pipes/percent-format.pipe';
import { PnlColorPipe } from '../../shared/pipes/pnl-color.pipe';

@Component({
  selector: 'app-portfolios',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    LoadingSpinnerComponent,
    ErrorBannerComponent,
    EmptyStateComponent,
    CurrencyFormatPipe,
    PercentFormatPipe,
    PnlColorPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="portfolios-page">
      <div class="page-header">
        <h1 class="page-title">Portfolios</h1>
        <button mat-flat-button color="primary" (click)="openCreate()">
          <mat-icon>add</mat-icon> New Portfolio
        </button>
      </div>

      @if (error()) {
        <app-error-banner
          [message]="error()!"
          (retry)="reload()"
        ></app-error-banner>
      }

      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else if (portfolios().length === 0) {
        <app-empty-state
          icon="folder_open"
          title="No portfolios yet"
          subtitle="Create your first portfolio to get started"
        ></app-empty-state>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="portfolios()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let p">
                <a [routerLink]="['/portfolios', p.id]" class="portfolio-link">{{ p.name }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="totalValue">
              <th mat-header-cell *matHeaderCellDef class="text-right">Total Value</th>
              <td mat-cell *matCellDef="let p" class="text-right price-mono">
                {{ p.totalValue | currencyFormat }}
              </td>
            </ng-container>

            <ng-container matColumnDef="dailyPnL">
              <th mat-header-cell *matHeaderCellDef class="text-right">Daily P&L</th>
              <td mat-cell *matCellDef="let p" class="text-right price-mono" [class]="p.dailyPnL | pnlColor">
                {{ p.dailyPnL | currencyFormat }}
                ({{ p.dailyPnLPercent | percentFormat }})
              </td>
            </ng-container>

            <ng-container matColumnDef="ytdReturn">
              <th mat-header-cell *matHeaderCellDef class="text-right">YTD Return</th>
              <td mat-cell *matCellDef="let p" class="text-right price-mono" [class]="p.ytdReturn | pnlColor">
                {{ p.ytdReturnPercent | percentFormat }}
              </td>
            </ng-container>

            <ng-container matColumnDef="currency">
              <th mat-header-cell *matHeaderCellDef>Currency</th>
              <td mat-cell *matCellDef="let p">{{ p.currency }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <button mat-icon-button matTooltip="Edit" (click)="openEdit(p)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Delete" color="warn" (click)="confirmDelete(p)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="cursor-pointer"></tr>
          </table>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .portfolios-page { max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-title { margin: 0; font-size: 24px; font-weight: 600; }
    .portfolio-link {
      text-decoration: none;
      color: #5c6bc0;
      font-weight: 500;
      &:hover { text-decoration: underline; }
    }
  `],
})
export class PortfoliosComponent implements OnInit {
  private store  = inject(Store<AppState>);
  private dialog = inject(MatDialog);

  displayedColumns = ['name', 'totalValue', 'dailyPnL', 'ytdReturn', 'currency', 'actions'];

  loading    = toSignal(this.store.select(selectPortfoliosLoading), { initialValue: false });
  error      = toSignal(this.store.select(selectPortfoliosError),   { initialValue: null });
  portfolios = toSignal(this.store.select(selectAllPortfolios),     { initialValue: [] });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.store.dispatch(PortfoliosActions.loadPortfolios());
  }

  openCreate(): void {
    const data: PortfolioDialogData = { mode: 'create' };
    this.dialog
      .open(PortfolioDialogComponent, { data, width: '480px' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe((result) => {
        this.store.dispatch(
          PortfoliosActions.createPortfolio({
            portfolio: {
              ...result,
              createdAt:          new Date().toISOString(),
              totalValue:         0,
              dailyPnL:           0,
              dailyPnLPercent:    0,
              ytdReturn:          0,
              ytdReturnPercent:   0,
            },
          })
        );
      });
  }

  openEdit(portfolio: Portfolio): void {
    const data: PortfolioDialogData = { mode: 'edit', portfolio };
    this.dialog
      .open(PortfolioDialogComponent, { data, width: '480px' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe((changes) => {
        this.store.dispatch(
          PortfoliosActions.updatePortfolio({ id: portfolio.id, changes })
        );
      });
  }

  confirmDelete(portfolio: Portfolio): void {
    const data: ConfirmDialogData = {
      title:   'Delete Portfolio',
      message: `Are you sure you want to delete "${portfolio.name}"? This cannot be undone.`,
      confirm: 'Delete',
      cancel:  'Cancel',
    };
    this.dialog
      .open(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.store.dispatch(PortfoliosActions.deletePortfolio({ id: portfolio.id }));
      });
  }
}
