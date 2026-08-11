import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ExamResult } from '../../models/exam.models';

@Component({
  selector: 'app-exam-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-history.component.html',
  styleUrl: './exam-history.component.scss'
})
export class ExamHistoryComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);

  results = signal<ExamResult[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.examService.getMyResults().subscribe({
      next: data => {
        this.results.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Unable to load exam history.');
        this.isLoading.set(false);
      }
    });
  }

  viewResult(resultId: number): void {
    this.router.navigate(['/exam', 'result', resultId]);
  }

  backToDashboard(): void {
    this.router.navigate(['/exam']);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return 'Not submitted';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Not submitted';
    }

    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
