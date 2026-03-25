import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  standalone: false
})
export class UserFormComponent implements OnInit {
  @Input() userId: string | null = null;
  @Output() onClose = new EventEmitter<boolean>();

  userForm: FormGroup;
  roles: any[] = [];
  isEditMode = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.isEditMode = !!this.userId;

    if (this.isEditMode && this.userId) {
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.loadUserData(this.userId);
    }
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (res) => {
        this.roles = res.data || [];
        this.cdr.detectChanges();
      }
    });
  }

  loadUserData(id: string): void {
    this.isLoading = true;
    this.userService.getUserById(id)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res) => {
          this.userForm.patchValue({
            name: res.data.name,
            email: res.data.email,
            roleId: res.data.role_id,
            password: ''
          });
        },
        error: (err) => console.error('Error al cargar datos del usuario', err)
      });
  }
  onSubmit(): void {
    if (this.userForm.invalid) return;
    this.isLoading = true;
    const userData = { ...this.userForm.value };

    if (this.isEditMode) {
      if (!userData.password || userData.password.trim() === '') {
        delete userData.password;
      }

      this.userService.updateUser(this.userId!, userData)
        .pipe(finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: (res) => this.handleSuccess(res.data),
          error: (err) => this.handleError(err)
        });
    } else {
      this.userService.createUser(userData)
        .pipe(finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: (res) => this.handleSuccess(res.data),
          error: (err) => this.handleError(err)
        });
    }
  }

  private handleSuccess(user: any) {
    const selectedRoleId = this.userForm.get('roleId')?.value;
    const fullRoleObject = this.roles.find(r => r.id === selectedRoleId);

    const updatedUser = {
      ...user,
      role: fullRoleObject ? { name: fullRoleObject.name } : null
    };

    this.onClose.emit(updatedUser);
  }

  private handleError(err: any) {
    alert(err.error?.error?.message || 'Error al procesar la solicitud');
  }

  cancel(): void {
    this.onClose.emit(false);
  }
}