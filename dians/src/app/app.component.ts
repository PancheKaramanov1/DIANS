import { Component, OnInit } from '@angular/core';
import { DataService } from './data.service';
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  data: any[] = [];
  errorMessage: string | null = null;

  constructor(
    private dataService: DataService,
    private router: Router  // Inject Router
  ) {}

  ngOnInit(): void {
    this.dataService.getLatestData().subscribe({
      next: (response) => {
        this.data = response;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.errorMessage = 'There was an error fetching the data from the server.';
      }
    });
  }

  navigateToOtherComponent(code: string): void {
    // Navigate to 'other-component' with the code as a parameter (optional)
    this.router.navigate(['/other-component', code]);
  }
}
