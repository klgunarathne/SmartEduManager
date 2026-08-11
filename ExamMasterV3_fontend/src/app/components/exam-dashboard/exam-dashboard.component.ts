import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { StudentAuthService } from '../../services/student-auth.service';
import { Exam } from '../../models/exam.models';
import { ExamService } from '../../services/exam.service';

interface AttendanceDto {
  studentId: number;
  date: string;
  isPresent: boolean;
}

interface DashboardStats {
  attendancePercentage: number;
  attendancePresent: number;
  attendanceTotal: number;
  nextExamTitle: string;
  nextExamDate: string;
}

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
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  studentUser = signal(this.authService.getCurrentUser());
  exams = this.examService.exams;
  isLoading = this.examService.isLoading;
  error = this.examService.error;
  stats = signal<DashboardStats>({
    attendancePercentage: 0,
    attendancePresent: 0,
    attendanceTotal: 0,
    nextExamTitle: 'No upcoming exam',
    nextExamDate: ''
  });
  now = new Date();

  ngOnInit(): void {
    this.examService.getAvailableExams().subscribe({
      next: () => this.updateNextExam(),
      error: () => this.updateNextExam()
    });
    this.loadAttendance();
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

  get attendanceLabel(): string {
    const stats = this.stats();

    if (stats.attendanceTotal === 0) {
      return 'No records';
    }

    return `${stats.attendancePresent}/${stats.attendanceTotal} days`;
  }

  get nextExamLabel(): string {
    return this.stats().nextExamDate || 'No date published';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadAttendance(): void {
    const studentId = this.studentUser()?.studentId;

    if (!studentId) {
      return;
    }

    this.http.get<AttendanceDto[]>(`${environment.apiUrl}/attendance/student/${studentId}`).subscribe({
      next: records => {
        const total = records.length;
        const present = records.filter(record => record.isPresent).length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        this.stats.update(current => ({
          ...current,
          attendancePercentage: percentage,
          attendancePresent: present,
          attendanceTotal: total
        }));
      },
      error: () => {
        this.stats.update(current => ({
          ...current,
          attendancePercentage: 0,
          attendancePresent: 0,
          attendanceTotal: 0
        }));
      }
    });
  }

  updateNextExam(): void {
    const upcomingExams = this.exams()
      .filter(exam => exam.status === 'active' || exam.status === 'scheduled')
      .sort((a, b) => this.getExamStartValue(a) - this.getExamStartValue(b));

    const nextExam = upcomingExams[0];

    if (!nextExam) {
      this.stats.update(current => ({
        ...current,
        nextExamTitle: 'No upcoming exam',
        nextExamDate: ''
      }));
      return;
    }

    this.stats.update(current => ({
      ...current,
      nextExamTitle: nextExam.title,
      nextExamDate: this.formatDate(nextExam.availableFrom || nextExam.availableTo || undefined)
    }));
  }

  getExamStartValue(exam: Exam): number {
    const value = exam.availableFrom || exam.availableTo || new Date().toISOString();
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
  }

  startExam(examId: number): void {
    this.router.navigate(['/exam', examId, 'instructions']);
  }

  resumeExam(examId: number): void {
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

  hasExistingAttempt(exam: Exam): boolean {
    return exam.questionCount > 0 && exam.isActive;
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

  resumeButtonText(): string {
    return 'Resume exam';
  }

  goToHistory(): void {
    this.router.navigate(['/exam', 'history']);
  }
}
