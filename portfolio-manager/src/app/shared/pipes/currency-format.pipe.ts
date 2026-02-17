import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyFormat', standalone: true })
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, currency = 'USD', compact = false): string {
    if (value == null) return '—';
    if (compact) {
      return this.compactFormat(value, currency);
    }
    return new Intl.NumberFormat('en-US', {
      style:                 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private compactFormat(value: number, currency: string): string {
    const absVal = Math.abs(value);
    const sign   = value < 0 ? '-' : '';
    const symbol = currency === 'USD' ? '$' : currency;
    if (absVal >= 1_000_000_000) {
      return `${sign}${symbol}${(absVal / 1_000_000_000).toFixed(2)}B`;
    }
    if (absVal >= 1_000_000) {
      return `${sign}${symbol}${(absVal / 1_000_000).toFixed(2)}M`;
    }
    if (absVal >= 1_000) {
      return `${sign}${symbol}${(absVal / 1_000).toFixed(2)}K`;
    }
    return `${sign}${symbol}${absVal.toFixed(2)}`;
  }
}
