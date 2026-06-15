import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StudentAuthService, StudentUser } from '../../services/student-auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Exam {
  id: number;
  title: string;
  description?: string;
  duration: number;
  questionCount: number;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  availableFrom?: Date | string;
  availableTo?: Date | string;
  categoryId: number;
}

@Component({
  selector: 'app-exam-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-dashboard.component.html',
  styleUrl: './exam-dashboard.component.scss'
})
export class ExamDashboardComponent implements OnInit {
  studentUser = computed(() => this.authService.getStudentUser());
  exams = signal<Exam[]>([]);
  private readonly API_URL = environment.apiUrl;

  constructor(
    private authService: StudentAuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const user = this.studentUser();
    console.log('Student user data:', user);
    this.loadExams();
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

  loadExams(): void {
    this.http.get<Exam[]>(`${this.API_URL}/exams/student`).subscribe({
      next: (data) => this.exams.set(data),
      error: () => this.exams.set([])
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  startExam(examId: number): void {
    this.router.navigate(['/exam', examId]);
  }
}