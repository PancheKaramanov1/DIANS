import { Component, OnInit } from '@angular/core';
import { DataService } from './data.service';
import { MatDialog } from '@angular/material/dialog'; // Import MatDialog
import { Router } from '@angular/router'; // Import Router
import { CodePopupComponent } from './code-popup/code-popup.component'; // Import the Popup Component
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    CommonModule,  // Add this to imports
  ]
})
export class AppComponent implements OnInit {
  data: any[] = [];
  errorMessage: string | null = null;
  scriptOutput: string | null = null;

  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private router: Router,
    private http: HttpClient
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

  openCodePopup(code: string): void {
    const dialogRef = this.dialog.open(CodePopupComponent, {
      width: '1000px',
      height: '600px',
      data: { code }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Dialog closed with result:', result);
      }
    });
  }

  runPythonScript(): void {
    this.http.get<{ message: string; output?: string; error?: string }>('http://localhost:3002/run-script')
      .subscribe({
        next: (response) => {
          if (response.output) {
            this.scriptOutput = response.output;
            this.errorMessage = null;
          }
        },
        error: (error) => {
          console.error('Error calling script:', error);
          this.errorMessage = error.error.message || 'An error occurred while executing the script.';
          this.scriptOutput = null;
        }
      });
  }
}
