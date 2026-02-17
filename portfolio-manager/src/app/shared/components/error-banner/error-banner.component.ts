import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-banner" role="alert">
      <mat-icon class="error-icon">error_outline</mat-icon>
      <span class="error-message">{{ message }}</span>
      @if (retryable) {
        <button mat-stroked-button color="warn" (click)="retry.emit()">
          <mat-icon>refresh</mat-icon> Retry
        </button>
      }
    </div>
  `,
  styles: [`
    .error-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--color-negative-bg);
      border: 1px solid var(--color-negative);
      border-radius: 8px;
      margin: 16px 0;
    }
    .error-icon { color: var(--color-negative); }
    .error-message { flex: 1; }
  `],
})
export class ErrorBannerComponent {
  @Input()  message   = 'An error occurred.';
  @Input()  retryable = true;
  @Output() retry = new EventEmitter<void>();
}
