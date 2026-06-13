import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAuthService, StudentUser } from '../../services/student-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-exam-dashboard',
  imports: [CommonModule],
  templateUrl: './exam-dashboard.component.html',
  styleUrl: './exam-dashboard.component.scss'
})
export class ExamDashboardComponent {
  studentUser = computed(() => this.authService.getStudentUser());
  
  constructor(
    private authService: StudentAuthService,
    private router: Router
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}