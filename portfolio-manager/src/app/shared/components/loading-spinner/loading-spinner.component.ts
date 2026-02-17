import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spinner-container">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      @if (message) {
        <p class="spinner-message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }
    .spinner-message {
      color: var(--mat-card-subtitle-text-color, rgba(0,0,0,.6));
      margin: 0;
    }
  `],
})
export class LoadingSpinnerComponent {
  @Input() diameter = 48;
  @Input() message  = '';
}
