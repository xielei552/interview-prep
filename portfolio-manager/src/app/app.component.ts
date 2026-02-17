import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

interface NavItem {
  label: string;
  icon:  string;
  route: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class.dark-theme]="isDark()">
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav
          #sidenav
          [mode]="isHandset() ? 'over' : 'side'"
          [opened]="!isHandset() || sidenavOpen()"
          class="app-sidenav"
        >
          <!-- Brand -->
          <div class="sidenav-brand">
            <mat-icon class="brand-icon">show_chart</mat-icon>
            <span class="brand-name">Portfolio<br><strong>Manager</strong></span>
          </div>

          <!-- Nav Links -->
          <mat-nav-list>
            @for (item of navItems; track item.route) {
              <a
                mat-list-item
                [routerLink]="item.route"
                routerLinkActive="active-link"
                (click)="isHandset() && sidenav.close()"
              >
                <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content>
          <!-- Toolbar -->
          <mat-toolbar color="primary" class="app-toolbar">
            @if (isHandset()) {
              <button mat-icon-button (click)="toggleSidenav()">
                <mat-icon>menu</mat-icon>
              </button>
            }
            <span class="flex-spacer"></span>

            <!-- Dark mode toggle -->
            <button
              mat-icon-button
              [matTooltip]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
              (click)="toggleDark()"
            >
              <mat-icon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
          </mat-toolbar>

          <!-- Page content -->
          <main class="content-area">
            <router-outlet></router-outlet>
          </main>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private breakpointObserver = inject(BreakpointObserver);

  // Signal-based local UI state — not everything goes in NgRx
  isDark      = signal(false);
  sidenavOpen = signal(false);

  // Responsive breakpoint as signal
  isHandset = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.Handset)
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: 'dashboard',       route: '/dashboard'    },
    { label: 'Portfolios',   icon: 'account_balance', route: '/portfolios'   },
    { label: 'Positions',    icon: 'trending_up',     route: '/positions'    },
    { label: 'Transactions', icon: 'receipt_long',    route: '/transactions' },
  ];

  toggleDark(): void    { this.isDark.update((v) => !v); }
  toggleSidenav(): void { this.sidenavOpen.update((v) => !v); }
}
