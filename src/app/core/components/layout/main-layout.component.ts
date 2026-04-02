import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  standalone: false
})
export class MainLayoutComponent implements OnInit {
  userName: string = 'Usuario';
  isAdmin: boolean = false;
  pageTitle: string = 'Panel Principal';
  pageSubtitle: string = 'Dashboard / Resumen';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateTitle(event.urlAfterRedirects);
    });
  }

  ngOnInit(): void {
    this.updateTitle(this.router.url);
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.userName = user.name || user.email || 'Usuario';
        this.isAdmin = this.authService.hasRole('admin');
      } else {
        this.userName = 'Usuario';
        this.isAdmin = false;
      }
    });
  }

  updateTitle(url: string): void {
    if (url.includes('/dashboard')) {
      this.pageTitle = 'Panel Principal';
      this.pageSubtitle = 'Dashboard / Resumen';
    } else if (url.includes('/billing')) {
      this.pageTitle = 'Facturación';
      this.pageSubtitle = 'Gestión / Comprobantes Fiscales';
    } else if (url.includes('/users')) {
      this.pageTitle = 'Gestión de Usuarios';
      this.pageSubtitle = 'Administración / Accesos';
    } else if (url.includes('/settings')) {
      this.pageTitle = 'Configuración';
      this.pageSubtitle = 'Sistema / Preferencias';
    } else {
      this.pageTitle = 'Virwo Billing';
      this.pageSubtitle = 'Plataforma';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}