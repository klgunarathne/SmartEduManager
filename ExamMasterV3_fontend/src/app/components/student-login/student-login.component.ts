import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentAuthService } from '../../services/student-auth.service';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-login.component.html',
  styleUrl: './student-login.component.scss'
})
export class StudentLoginComponent {
  username = '';
  password = '';
  rememberDevice = false;
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private authService: StudentAuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.username.trim() || !this.password) {
      this.error.set('Please enter your NIC number and password.');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        if (this.rememberDevice) {
          localStorage.setItem('exam-master-remember-device', 'true');
        } else {
          localStorage.removeItem('exam-master-remember-device');
        }

        this.router.navigate(['/exam']);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set(this.authService.error() || 'Invalid NIC number or password.');
      }
    });
  }
}
