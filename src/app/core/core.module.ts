import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Importante para el Sidebar
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    LoginComponent,
    MainLayoutComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule // Necesario para que funcionen los routerLink del Sidebar
  ],
  exports: [
    LoginComponent,
    MainLayoutComponent // Exportamos para que el Router pueda usarlo
  ]
})
export class CoreModule { }