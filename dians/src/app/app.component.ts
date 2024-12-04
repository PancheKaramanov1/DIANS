import { Component, OnInit } from '@angular/core';
import { DataService } from './data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  data: any[] = [];
  errorMessage: string | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    console.log('Fetching data from:', this.dataService.getLatestData());
  }
}
