import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppComponent } from './app.component';
import { SpecificCodeTableComponent } from './specific-code-table.component';

const routes: Routes = [
  { path: '', component: AppComponent }, // Home route
  { path: 'specific-code-table-component', component: SpecificCodeTableComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes), CommonModule],
  exports: [RouterModule],
})
export class AppRoutingModule {}
