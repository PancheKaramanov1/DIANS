import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-code-popup',
  templateUrl: './code-popup.component.html',
  styleUrls: ['./code-popup.component.css'],
  imports: [
    CommonModule,  // Add this to imports
  ]
})
export class CodePopupComponent {
  code: string;
  data: any = null;
  errorMessage: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<CodePopupComponent>, // To close the dialog
    @Inject(MAT_DIALOG_DATA) public dialogData: { code: string }, // Receive code
    private dataService: DataService // Inject DataService
  ) {
    this.code = dialogData.code;
    this.fetchDataForCode(this.code);
  }

  fetchDataForCode(code: string): void {
    console.log(this.dataService.getDataForCode(code));
    this.dataService.getDataForCode(code).subscribe({
      next: (response) => {
        this.data = response;
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.errorMessage = 'There was an error fetching the data for the code.';
      }
    });
    console.log(this.data);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
