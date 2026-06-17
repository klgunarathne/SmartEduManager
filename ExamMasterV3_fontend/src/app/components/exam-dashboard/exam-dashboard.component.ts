import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StudentAuthService } from '../../services/student-auth.service';
import { Exam } from '../../models/exam.models';
import { ExamService } from '../../services/exam.service';

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

  studentUser = signal(this.authService.getCurrentUser());
  exams = this.examService.exams;
  isLoading = this.examService.isLoading;
  error = this.examService.error;
  now = new Date();

  ngOnInit(): void {
    this.examService.getAvailableExams().subscribe();
  }

  get displayName(): string {
    const user = this.studentUser();

    if (user?.fullName) {
      return user.fullName;
    }

    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }

    return user?.username || 'Student';
  }

  get misNo(): string {
    return this.studentUser()?.misNo || 'N/A';
  }

  get batchCode(): string {
    return this.studentUser()?.batchCode || 'N/A';
  }

  get email(): string {
    return this.studentUser()?.email || 'N/A';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  startExam(examId: number): void {
    this.router.navigate(['/exam', examId]);
  }

  canStart(exam: Exam): boolean {
    if (exam.status !== 'active' && exam.status !== 'scheduled') {
      return false;
    }

    const now = Date.now();

    if (exam.availableFrom) {
      const start = new Date(exam.availableFrom).getTime();
      if (!Number.isNaN(start) && start > now) {
        return false;
      }
    }

    if (exam.availableTo) {
      const end = new Date(exam.availableTo).getTime();
      if (!Number.isNaN(end) && end < now) {
        return false;
      }
    }

    return true;
  }

  examStatusLabel(exam: Exam): string {
    if (exam.status === 'active') {
      return 'Available now';
    }

    if (exam.status === 'scheduled') {
      return 'Scheduled';
    }

    return 'Draft';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  startButtonText(exam: Exam): string {
    if (exam.status !== 'active' && exam.status !== 'scheduled') {
      return 'Not available';
    }

    if (exam.availableFrom && new Date(exam.availableFrom).getTime() > Date.now()) {
      return 'Opens soon';
    }

    return 'Start exam';
  }
}
