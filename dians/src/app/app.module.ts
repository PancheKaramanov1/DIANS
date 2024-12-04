import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http'; // <-- Add this import
import { DataService } from './data.service'; // <-- Ensure DataService is imported

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule // <-- Add this module to imports
  ],
  providers: [DataService], // Ensure DataService is provided
  bootstrap: [AppComponent]
})
export class AppModule { }
