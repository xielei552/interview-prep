import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pnlColor', standalone: true })
export class PnlColorPipe implements PipeTransform {
  transform(value: number | null | undefined): 'pnl-positive' | 'pnl-negative' | 'pnl-neutral' {
    if (value == null || value === 0) return 'pnl-neutral';
    return value > 0 ? 'pnl-positive' : 'pnl-negative';
  }
}
