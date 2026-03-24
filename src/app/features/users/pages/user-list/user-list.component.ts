import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  standalone: false
})
export class UserListComponent implements OnInit {

  // Simulamos datos para la tabla mientras conectamos el servicio de Node
  users = [
    {
      id: 1,
      name: 'Eduardo Campuzano',
      email: 'eduardo@discoverit.com',
      role: 'Admin',
      status: 'Activo'
    },
    {
      id: 2,
      name: 'Contador General',
      email: 'contabilidad@discoverit.com',
      role: 'Contador',
      status: 'Activo'
    }
  ];

  constructor() { }

  ngOnInit(): void {
    console.log('Modulo de Usuarios cargado correctamente');
  }

  editUser(user: any): void {
    console.log('Editando usuario:', user.name);
  }

  deleteUser(id: number): void {
    console.log('Eliminando usuario con ID:', id);
  }

}