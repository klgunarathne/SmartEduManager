import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserService, User, Role, CreateUserDto, UpdateUserDto } from '../../core/services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  isLoading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<string | null>(null);
  showPasswordField = signal<boolean>(true);

  userForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    address: [''],
    dateOfBirth: [''],
    roles: [[], Validators.required],
    status: ['Active']
  }, { validators: this.passwordMatchValidator.bind(this) });

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (data) => { 
        this.users.set(data); 
        this.isLoading.set(false); 
      },
      error: () => { this.isLoading.set(false); }
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (data) => { this.roles.set(data); },
      error: () => {}
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) return;
    
    // Check password match
    if (this.showPasswordField()) {
      const password = this.userForm.get('password')?.value;
      const confirmPassword = this.userForm.get('confirmPassword')?.value;
      if (password !== confirmPassword) {
        this.userForm.get('confirmPassword')?.setErrors({ passwordMismatch: true });
        return;
      }
    }
    
    this.isLoading.set(true);

    if (this.isEditing() && this.editingId() !== null) {
      const formData: UpdateUserDto = {
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        email: this.userForm.value.email,
        address: this.userForm.value.address,
        dateOfBirth: this.userForm.value.dateOfBirth,
        roles: this.userForm.value.roles,
        status: this.userForm.value.status
      };
      this.userService.updateUser(this.editingId()!, formData).subscribe({
        next: () => { this.resetForm(); this.loadUsers(); },
        error: () => { this.isLoading.set(false); }
      });
    } else {
      const formData: CreateUserDto = {
        firstName: this.userForm.value.firstName,
        lastName: this.userForm.value.lastName,
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        address: this.userForm.value.address,
        dateOfBirth: this.userForm.value.dateOfBirth,
        roles: this.userForm.value.roles
      };
      this.userService.createUser(formData).subscribe({
        next: () => { this.resetForm(); this.loadUsers(); },
        error: () => { this.isLoading.set(false); }
      });
    }
  }

  editUser(user: User): void {
    this.isEditing.set(true);
    this.editingId.set(user.id);
    this.showPasswordField.set(false);
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      roles: user.roles || [],
      status: user.status
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
  }

  deleteUser(id: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.isLoading.set(true);
      this.userService.deleteUser(id).subscribe({
        next: () => { this.loadUsers(); },
        error: () => { this.isLoading.set(false); }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.userForm.reset({ status: 'Active', roles: [] });
    this.isEditing.set(false);
    this.editingId.set(null);
    this.showPasswordField.set(true);
    this.isLoading.set(false);
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
  }

  onRoleChange(roleName: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const currentRoles: string[] = this.userForm.get('roles')?.value || [];
    
    if (checkbox.checked) {
      if (!currentRoles.includes(roleName)) {
        currentRoles.push(roleName);
      }
    } else {
      const index = currentRoles.indexOf(roleName);
      if (index > -1) {
        currentRoles.splice(index, 1);
      }
    }
    this.userForm.get('roles')?.setValue([...currentRoles]);
  }

  isRoleSelected(roleName: string): boolean {
    const currentRoles: string[] = this.userForm.get('roles')?.value || [];
    return currentRoles.includes(roleName);
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }
}
