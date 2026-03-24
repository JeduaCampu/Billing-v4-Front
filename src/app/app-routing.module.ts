import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './core/components/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './core/components/layout/main-layout.component';

const routes: Routes = [
  // Ruta pública para el acceso
  { 
    path: 'login', 
    component: LoginComponent 
  },

  // Rutas protegidas que utilizan el Layout principal (Sidebar + Navbar)
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
      // Redirección por defecto al entrar a la raíz de la app
      { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full' 
      }
    ]
  },

  // Comodín para rutas no encontradas, redirige al login o podrías crear una página 404
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