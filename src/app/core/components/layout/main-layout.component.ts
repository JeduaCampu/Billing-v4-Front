import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  standalone: false
})
export class MainLayoutComponent implements OnInit {
  userName: string = 'Usuario';
  isAdmin: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}