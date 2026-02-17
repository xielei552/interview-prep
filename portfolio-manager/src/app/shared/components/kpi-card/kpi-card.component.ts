import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { PercentFormatPipe } from '../../pipes/percent-format.pipe';
import { PnlColorPipe } from '../../pipes/pnl-color.pipe';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule, CurrencyFormatPipe, PercentFormatPipe, PnlColorPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="kpi-card">
      <mat-card-content>
        <div class="kpi-header">
          <mat-icon class="kpi-icon" [style.color]="iconColor">{{ icon }}</mat-icon>
          <span class="kpi-label">{{ label }}</span>
        </div>
        <div class="kpi-value price-mono">{{ value | currencyFormat: currency : true }}</div>
        @if (change != null) {
          <div class="kpi-change" [class]="change | pnlColor">
            {{ change | currencyFormat: currency : true }}
            @if (changePercent != null) {
              <span>({{ changePercent | percentFormat }})</span>
            }
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .kpi-card { height: 100%; }
    .kpi-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .kpi-icon { font-size: 20px; width: 20px; height: 20px; }
    .kpi-label {
      font-size: 13px;
      color: var(--mat-card-subtitle-text-color, rgba(0,0,0,.6));
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 600;
      margin: 4px 0;
    }
    .kpi-change {
      font-size: 13px;
      font-weight: 500;
    }
  `],
})
export class KpiCardComponent {
  @Input() label        = '';
  @Input() value        = 0;
  @Input() change:        number | null = null;
  @Input() changePercent: number | null = null;
  @Input() icon         = 'account_balance_wallet';
  @Input() iconColor    = '#5c6bc0';
  @Input() currency     = 'USD';
}
