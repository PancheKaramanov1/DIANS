// src/app/data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'http://localhost:3000/api/get-latest';
  private apiUrl1 = 'http://localhost:3001/api/get-latest';

  constructor(private http: HttpClient) {}

  getLatestData(): Observable<any[]> {
    console.log('Fetching data from:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl);
  }

  getDataForCode(code: string): Observable<any> {
    console.log('Fetching data from:', this.apiUrl1);
    return this.http.get<any>(`${this.apiUrl1}/${code}`);
  }
}
