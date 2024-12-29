// src/app/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api/get-latest';
  private apiUrl1 = 'http://localhost:3001/stock-analysis';
  private apiUrl2 = 'http://localhost:3003/analyze-stock';

  constructor(private http: HttpClient) {}

  getLatestData(): Observable<any[]> {
    console.log('Fetching data from:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl);
  }

  getDataForCode(code: string, date?: Date): Observable<any> {
    console.log('Fetching data from:', `${this.apiUrl1}/${code}`, { date });
    let params: any = {};
    if (date) {
      params.date = date;
    }
    const result = this.http.get<any>(`${this.apiUrl1}/${code}`, { params });
    console.log(result);
    return result;
  }

  getNewsForCode(code: string): Observable<any> {
    console.log('Fetching news from:', `${this.apiUrl2}/${code}`);
    return this.http.get<any>(`${this.apiUrl2}/${code}`);
  }
}
