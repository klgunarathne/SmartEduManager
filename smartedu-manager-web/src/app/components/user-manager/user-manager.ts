import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, Role } from '../../services/user.service';
import { CourseService, Course } from '../../services/course.service';
import { CenterService, Center } from '../../services/center.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-user-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-manager.html',
  styleUrl: './user-manager.scss'
})
export class UserManagerComponent implements OnInit {
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private courseService = inject(CourseService);
  private centerService = inject(CenterService);

  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;

  selectedUser: User = this.getEmptyUser();
  availableRoles: string[] = [];
  availableCourses = signal<Course[]>([]);
  availableCenters = signal<Center[]>([]);
  confirmPassword: string = '';

  ngOnInit(): void {
    this.userService.getUsers().subscribe();
    this.userService.getRoles().subscribe({
      next: (roles) => {
        this.availableRoles = roles.map(r => r.name);
      }
    });
    this.loadCourses();
    this.loadCenters();
  }

  private loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (courses) => this.availableCourses.set(courses)
    });
  }

  private loadCenters(): void {
    this.centerService.getCenters().subscribe({
      next: (centers) => {
        this.centerService.getDistricts().subscribe({
          next: (districts) => {
            this.availableCenters.set(centers);
            this.centerService.districts.set(districts);
          }
        });
      }
    });
  }

  private getEmptyUser(): User {
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      dateOfBirth: undefined,
      imageUrl: '',
      roles: [],
      status: 'Active',
      centerId: undefined,
      courseId: undefined
    };
  }

  openAddModal(): void {
    this.selectedUser = this.getEmptyUser();
    this.modalMode.set('add');
    this.showModal.set(true);
  }

  openEditModal(user: User): void {
    this.selectedUser = { ...user, roles: [...user.roles] };
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedUser = this.getEmptyUser();
  }

  saveUser(): void {
    if (this.modalMode() === 'add') {
      if (this.selectedUser.roles.includes('Instructor')) {
        if (!this.validatePassword()) {
          return;
        }
        
        if (this.selectedUser.password !== this.confirmPassword) {
          this.toast.warning('Passwords do not match');
          return;
        }
      }
      
      const userData = { ...this.selectedUser };
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('User created successfully');
        },
        error: (error: any) => {
          console.error('Failed to create user:', error);
          this.toast.error('Failed to create user: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.userService.updateUser(this.selectedUser.id, this.selectedUser).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('User updated successfully');
        },
        error: (error: any) => {
          console.error('Failed to update user:', error);
          this.toast.error('Failed to update user: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  validatePassword(): boolean {
    const password = this.selectedUser.password || '';
    
    if (password.length < 6) {
      this.toast.warning('Password must be at least 6 characters long');
      return false;
    }
    if (!/\d/.test(password)) {
      this.toast.warning('Password must contain at least one digit (0-9)');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      this.toast.warning('Password must contain at least one lowercase letter (a-z)');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      this.toast.warning('Password must contain at least one uppercase letter (A-Z)');
      return false;
    }
    if (!/[!@#$%^&*]/.test(password)) {
      this.toast.warning('Password must contain at least one special character (!@#$%^&*)');
      return false;
    }
    
    return true;
  }

  get passwordRequirements() {
    const password = this.selectedUser.password || '';
    return {
      minLength: password.length >= 6,
      digit: /\d/.test(password),
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.toast.success('User deleted successfully');
        },
        error: (error) => {
          console.error('Failed to delete user:', error);
          this.toast.error('Failed to delete user');
        }
      });
    }
  }

  toggleRole(role: string): void {
    const index = this.selectedUser.roles.indexOf(role);
    if (index === -1) {
      this.selectedUser.roles.push(role);
    } else {
      this.selectedUser.roles.splice(index, 1);
    }
  }

  hasRole(user: User, role: string): boolean {
    return user.roles.includes(role);
  }

  get users(): User[] {
    return this.userService.users();
  }

  get isLoading(): boolean {
    return this.userService.isLoading();
  }

  get filteredUsers(): User[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.users;
    
    return this.users.filter(user => 
      user.firstName?.toLowerCase().includes(term) ||
      user.lastName?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.roles.some(r => r.toLowerCase().includes(term))
    );
  }

  get paginatedUsers(): User[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsers.slice(start, end);
  }

  totalPagesCount(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPagesCount()) {
      this.currentPage.update(p => p + 1);
    }
  }

  getInitials(user: User): string {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  }

  getAvatarColor(user: User): string {
    const colors = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #10b981, #34d399)',
      'linear-gradient(135deg, #f59e0b, #fbbf24)',
      'linear-gradient(135deg, #ec4899, #f472b6)',
      'linear-gradient(135deg, #3b82f6, #60a5fa)',
      'linear-gradient(135deg, #ef4444, #f87171)'
    ];
    const index = user.email?.charCodeAt(0) || 0;
    return colors[index % colors.length];
  }
}
