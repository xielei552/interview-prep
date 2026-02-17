import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Transaction } from '../../store/app.state';

export interface TransactionPage {
  data:       Transaction[];
  totalCount: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly base = '/api/transactions';

  constructor(private http: HttpClient) {}

  getPage(params: {
    portfolioId?: string;
    page:         number;
    pageSize:     number;
    dateFrom?:    string | null;
    dateTo?:      string | null;
  }): Observable<TransactionPage> {
    let httpParams = new HttpParams()
      .set('_page', params.page)
      .set('_limit', params.pageSize)
      .set('_sort', 'date')
      .set('_order', 'desc');

    if (params.portfolioId) {
      httpParams = httpParams.set('portfolioId', params.portfolioId);
    }
    if (params.dateFrom) {
      httpParams = httpParams.set('date_gte', params.dateFrom);
    }
    if (params.dateTo) {
      httpParams = httpParams.set('date_lte', params.dateTo);
    }

    return this.http
      .get<Transaction[]>(this.base, {
        params:  httpParams,
        observe: 'response',
      })
      .pipe(
        map((resp: HttpResponse<Transaction[]>) => ({
          data:       resp.body ?? [],
          totalCount: Number(resp.headers.get('X-Total-Count') ?? 0),
        }))
      );
  }
}
