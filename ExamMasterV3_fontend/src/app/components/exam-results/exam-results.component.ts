import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ExamAnswerResult, ExamResult } from '../../models/exam.models';
import { ExamService } from '../../services/exam.service';

@Component({
  selector: 'app-exam-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-results.component.html',
  styleUrl: './exam-results.component.scss'
})
export class ExamResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly examService = inject(ExamService);

  result = signal<ExamResult | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const resultId = Number(this.route.snapshot.paramMap.get('resultId'));

    if (!resultId) {
      this.router.navigate(['/exam']);
      return;
    }

    this.loadResult(resultId);
  }

  loadResult(resultId: number): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.examService.getResult(resultId).subscribe({
      next: data => {
        this.result.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Unable to load result. Please return to the dashboard and try again.');
        this.isLoading.set(false);
      }
    });
  }

  get gradeColor(): string {
    const percentage = this.result()?.percentage ?? 0;

    if (percentage >= 80) {
      return '#16a34a';
    }

    if (percentage >= 60) {
      return '#2563eb';
    }

    if (percentage >= 40) {
      return '#d97706';
    }

    return '#dc2626';
  }

  get gradeLabel(): string {
    const percentage = this.result()?.percentage ?? 0;

    if (percentage >= 80) {
      return 'Excellent';
    }

    if (percentage >= 60) {
      return 'Good';
    }

    if (percentage >= 40) {
      return 'Pass';
    }

    return 'Needs improvement';
  }

  get answeredCount(): number {
    return this.result()?.answers.filter(answer => this.hasAnswer(answer)).length ?? 0;
  }

  get submittedDate(): string {
    return this.formatDate(this.result()?.submittedAt);
  }

  get correctCount(): number {
    return this.result()?.answers.filter(answer => answer.isCorrect).length ?? 0;
  }

  get wrongCount(): number {
    return (this.result()?.answers.length ?? 0) - this.correctCount;
  }

  answerStatusClass(answer: ExamAnswerResult): 'correct' | 'wrong' {
    return answer.isCorrect ? 'correct' : 'wrong';
  }

  answerStatusLabel(answer: ExamAnswerResult): string {
    return answer.isCorrect ? 'Correct' : 'Incorrect';
  }

  hasAnswer(answer: ExamAnswerResult): boolean {
    return answer.selectedAnswer !== null && answer.selectedAnswer !== undefined && answer.selectedAnswer.trim().length > 0;
  }

  answerLabel(answer: ExamAnswerResult): string {
    if (!this.hasAnswer(answer)) {
      return 'Not answered';
    }

    return answer.selectedAnswer ?? '';
  }

  correctAnswerLabel(answer: ExamAnswerResult): string {
    if (!answer.correctAnswer || answer.correctAnswer.trim() === '') {
      return 'Not provided';
    }

    return answer.correctAnswer;
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
  backToDashboard(): void {
    this.router.navigate(['/exam']);
  }
}
