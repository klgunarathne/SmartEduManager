import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentAuthService, StudentLoginDto } from '../../services/student-auth.service';

@Component({
  selector: 'app-student-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './student-login.component.html',
  styleUrl: './student-login.component.scss'
})
export class StudentLoginComponent {
  username = '';
  password = '';
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private authService: StudentAuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.username || !this.password) {
      this.error.set('Please enter both NIC No and password');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const credentials: StudentLoginDto = {
      username: this.username,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/exam']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set('Invalid NIC No or password');
      }
    });
  }
}