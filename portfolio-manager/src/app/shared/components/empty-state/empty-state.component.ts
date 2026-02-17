import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <h3 class="empty-title">{{ title }}</h3>
      @if (subtitle) {
        <p class="empty-subtitle">{{ subtitle }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: var(--mat-card-subtitle-text-color, rgba(0,0,0,.38));
      margin-bottom: 16px;
    }
    .empty-title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 500;
    }
    .empty-subtitle {
      color: var(--mat-card-subtitle-text-color, rgba(0,0,0,.6));
      margin: 0;
    }
  `],
})
export class EmptyStateComponent {
  @Input() icon     = 'inbox';
  @Input() title    = 'No data';
  @Input() subtitle = '';
}
