import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'percentFormat', standalone: true })
export class PercentFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 2, showSign = true): string {
    if (value == null) return '—';
    const prefix = showSign && value > 0 ? '+' : '';
    return `${prefix}${value.toFixed(decimals)}%`;
  }
}
