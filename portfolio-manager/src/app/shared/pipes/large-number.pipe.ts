import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'largeNumber', standalone: true })
export class LargeNumberPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    const absVal = Math.abs(value);
    const sign   = value < 0 ? '-' : '';
    if (absVal >= 1_000_000_000) return `${sign}${(absVal / 1_000_000_000).toFixed(2)}B`;
    if (absVal >= 1_000_000)     return `${sign}${(absVal / 1_000_000).toFixed(2)}M`;
    if (absVal >= 1_000)         return `${sign}${(absVal / 1_000).toFixed(2)}K`;
    return `${sign}${absVal.toFixed(2)}`;
  }
}
