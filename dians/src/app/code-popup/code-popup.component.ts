import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables); // Register chart types

@Component({
  selector: 'app-code-popup',
  templateUrl: './code-popup.component.html',
  styleUrls: ['./code-popup.component.css'],
  imports: [
    CommonModule, 
    BaseChartDirective,
  ]
})
export class CodePopupComponent {
  code: string;
  data: any = null;
  errorMessage: string | null = null;
  buyOrSell: string | null = null;

  // Chart options and data
  chartData1W: any = {
    labels: [],
    datasets: [
      {
        label: 'RSI',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false
      },
      {
        label: 'SMA',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false
      },
      {
        label: 'EMA',
        data: [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false
      }
    ]
  };

  chartData1M: any = {
    labels: [],
    datasets: [
      {
        label: 'RSI',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false
      },
      {
        label: 'SMA',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: false
      },
      {
        label: 'EMA',
        data: [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: false
      }
    ]
  };

  chartOptions: any = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Value'
        }
      }
    }
  };

  constructor(
    public dialogRef: MatDialogRef<CodePopupComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: { code: string },
    private dataService: DataService
  ) {
    this.code = dialogData.code;
    this.fetchDataForCode(this.code);
  }

  fetchDataForCode(code: string): void {
    this.dataService.getDataForCode(code).subscribe({
      next: (response) => {
        this.data = response;
        this.updateChartData();
      },
      error: (error) => {
        console.error('Error fetching data:', error);
        this.errorMessage = 'There was an error fetching the data for the code.';
      }
    });
    this.dataService.getNewsForCode(code).subscribe((news) => {
      console.log(news);
      this.buyOrSell = news.final_decision;
    });
  }

  updateChartData(): void {
    const analysis1W = this.data.analysis1W;
    console.log(analysis1W.dates);
    const dates1W = analysis1W.dates;
    const rsi1W = analysis1W.rsi;
    const sma1W = analysis1W.sma;
    const ema1W = analysis1W.ema;
    console.log({ dates1W, rsi1W, sma1W, ema1W });

    this.chartData1W.labels = dates1W;
    this.chartData1W.datasets[0].data = rsi1W;
    this.chartData1W.datasets[1].data = sma1W;
    this.chartData1W.datasets[2].data = ema1W;

    const analysis1M = this.data.analysis1M;
    const dates1M = analysis1M.dates;
    const rsi1M = analysis1M.rsi;
    const sma1M = analysis1M.sma;
    const ema1M = analysis1M.ema;
    console.log({ dates1M, rsi1M, sma1M, ema1M });

    this.chartData1M.labels = dates1M;
    this.chartData1M.datasets[0].data = rsi1M;
    this.chartData1M.datasets[1].data = sma1M;
    this.chartData1M.datasets[2].data = ema1M;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
