import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from './components/layout/main-layout.component';
import { LoginComponent } from './components/login/login.component';
import { FormsModule } from '@angular/forms';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';

@NgModule({
  declarations: [LoginComponent, MainLayoutComponent, AccessDeniedComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
  ],
  exports: [
    LoginComponent,
    MainLayoutComponent,
  ],
})
export class CoreModule {}
