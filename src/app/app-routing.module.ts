import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './core/components/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './core/components/layout/main-layout.component';
import { AccessDeniedComponent } from './core/components/access-denied/access-denied.component';
import { TwoFactorSetupComponent } from './features/security/two-factor-setup/two-factor-setup.component';

const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent 
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { 
        path: 'dashboard', 
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) 
      },
      { 
        path: 'billing', 
        loadChildren: () => import('./features/billing/billing.module').then(m => m.BillingModule) 
      },
      { 
        path: 'users', 
        loadChildren: () => import('./features/users/users.module').then(m => m.UsersModule) 
      },
      { 
        path: 'settings', 
        component: TwoFactorSetupComponent
      },
      { path: 'access-denied', component: AccessDeniedComponent },
      { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full' 
      }
    ]
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }