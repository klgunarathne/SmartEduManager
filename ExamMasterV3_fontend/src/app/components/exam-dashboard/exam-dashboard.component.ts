import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StudentAuthService, StudentUser } from '../../services/student-auth.service';
import { ExamService, Exam } from '../../services/exam.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-exam-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-dashboard.component.html',
  styleUrl: './exam-dashboard.component.scss'
})
export class ExamDashboardComponent implements OnInit {
  private readonly authService = inject(StudentAuthService);
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);

  studentUser = computed(() => this.authService.getStudentUser());
  exams = this.examService.exams;
  isLoading = this.examService.isLoading;

  ngOnInit(): void {
    this.examService.getExams().subscribe({
      error: () => this.exams.set([])
    });
  }

  get misNo(): string {
    const user = this.studentUser();
    return user?.misNo || 'N/A';
  }

  get batchCode(): string {
    const user = this.studentUser();
    return user?.batchCode || 'N/A';
  }

  get displayName(): string {
    const user = this.studentUser();
    return user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.fullName || 'Student';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  startExam(examId: number): void {
    this.router.navigate(['/exam', examId]);
  }
}