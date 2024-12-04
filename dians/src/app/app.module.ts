import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module'; // Import the routing module

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule],  // Add AppRoutingModule here
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
