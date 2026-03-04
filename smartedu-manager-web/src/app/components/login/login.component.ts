import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginDto } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="logo-container">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <h1>SmartEdu Manager</h1>
            <p>Sign in to your account</p>
          </div>
          
          <form (ngSubmit)="onSubmit()" class="login-form">
            @if (errorMessage()) {
              <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                {{ errorMessage() }}
              </div>
            }
            
            <div class="form-group">
              <label for="email">Email Address</label>
              <div class="input-group">
                <span class="input-icon">
                  <i class="fas fa-envelope"></i>
                </span>
                <input 
                  type="email" 
                  id="email" 
                  [(ngModel)]="credentials.email" 
                  name="email"
                  placeholder="Enter your email"
                  required
                  [disabled]="isLoading()"
                >
              </div>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-group">
                <span class="input-icon">
                  <i class="fas fa-lock"></i>
                </span>
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  id="password" 
                  [(ngModel)]="credentials.password" 
                  name="password"
                  placeholder="Enter your password"
                  required
                  [disabled]="isLoading()"
                >
                <button 
                  type="button" 
                  class="password-toggle"
                  (click)="showPassword.set(!showPassword())"
                >
                  <i class="fas" [class.fa-eye]="!showPassword()" [class.fa-eye-slash]="showPassword()"></i>
                </button>
              </div>
            </div>
            
            <div class="form-options">
              <div class="remember-me">
                <input type="checkbox" id="remember" [(ngModel)]="rememberMe" name="remember">
                <label for="remember">Remember me</label>
              </div>
              <a href="#" class="forgot-password">Forgot password?</a>
            </div>
            
            <button 
              type="submit" 
              class="btn-login"
              [disabled]="isLoading()"
            >
              @if (isLoading()) {
                <i class="fas fa-spinner fa-spin"></i>
                Signing in...
              } @else {
                Sign In
              }
            </button>
          </form>
          
          <div class="login-footer">
            <p>&copy; 2026 SmartEdu Manager. All rights reserved.</p>
          </div>
        </div>
        
        <div class="login-background">
          <div class="bg-shape bg-shape-1"></div>
          <div class="bg-shape bg-shape-2"></div>
          <div class="bg-shape bg-shape-3"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-container {
      position: relative;
      width: 100%;
      max-width: 450px;
    }

    .login-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      padding: 45px 40px;
      position: relative;
      z-index: 10;
    }

    .login-header {
      text-align: center;
      margin-bottom: 35px;
    }

    .logo-container {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    .logo-container i {
      font-size: 36px;
      color: white;
    }

    .login-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    }

    .login-header p {
      color: #6b7280;
      font-size: 15px;
    }

    .login-form {
      margin-bottom: 25px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }

    .alert-danger {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .input-group {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 15px;
      color: #9ca3af;
      font-size: 16px;
      z-index: 2;
    }

    .input-group input {
      width: 100%;
      padding: 14px 45px 14px 45px;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      font-size: 15px;
      transition: all 0.3s ease;
      background: #f9fafb;
    }

    .input-group input:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    }

    .input-group input:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
    }

    .password-toggle {
      position: absolute;
      right: 15px;
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      font-size: 16px;
      transition: color 0.3s;
    }

    .password-toggle:hover {
      color: #667eea;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      font-size: 14px;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
    }

    .remember-me input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #667eea;
      cursor: pointer;
    }

    .forgot-password {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }

    .forgot-password:hover {
      color: #764ba2;
    }

    .btn-login {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-login:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
    }

    .btn-login:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-login:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .login-footer {
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }

    .login-background {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      z-index: 1;
    }

    .bg-shape {
      position: absolute;
      border-radius: 50%;
      opacity: 0.1;
    }

    .bg-shape-1 {
      width: 300px;
      height: 300px;
      background: white;
      top: -100px;
      right: -100px;
    }

    .bg-shape-2 {
      width: 200px;
      height: 200px;
      background: white;
      bottom: -50px;
      left: -50px;
    }

    .bg-shape-3 {
      width: 150px;
      height: 150px;
      background: white;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 30px 25px;
      }

      .login-header h1 {
        font-size: 24px;
      }

      .form-options {
        flex-direction: column;
        gap: 15px;
        align-items: flex-start;
      }
    }
  `]
})
export class LoginComponent {
  credentials: LoginDto = { email: '', password: '' };
  rememberMe = false;
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage.set('Please enter both email and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (this.authService.isAdmin()) {
          this.router.navigate(['/admin/dashboard']);
        } else if (this.authService.isInstructor()) {
          this.router.navigate(['/instructor/dashboard']);
        } else if (this.authService.isStudent()) {
          this.router.navigate(['/student/dashboard']);
        } else {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('Invalid email or password');
        } else if (error.status === 0) {
          this.errorMessage.set('Unable to connect to server. Please try again later.');
        } else {
          this.errorMessage.set(error.error?.message || 'An error occurred. Please try again.');
        }
      }
    });
  }
}
