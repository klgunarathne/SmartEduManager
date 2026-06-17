import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';

interface ExamAnswerResultDto {
  questionId: number;
  questionContent: string;
  selectedAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  marksObtained: number;
  totalMarks: number;
}

interface ExamResult {
  id: number;
  examId: number;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  startedAt: string;
  submittedAt: string;
  answers: ExamAnswerResultDto[];
}

@Component({
  selector: 'app-exam-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-results.component.html',
  styleUrl: './exam-results.component.scss'
})
export class ExamResultsComponent implements OnInit {
  result = signal<ExamResult | null>(null);
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  ngOnInit(): void {
    const resultId = Number(this.route.snapshot.paramMap.get('resultId'));
    if (!resultId) {
      this.router.navigate(['/exam']);
      return;
    }
    this.loadResult(resultId);
  }

  loadResult(resultId: number): void {
    this.http.get<ExamResult>(`${environment.apiUrl}/exam-attempts/results/${resultId}`).subscribe({
      next: (data) => this.result.set(data),
      error: (err) => {
        console.error('Failed to load result:', err);
        this.router.navigate(['/exam']);
      }
    });
  }

  get gradeColor(): string {
    const pct = this.result()?.percentage || 0;
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#3b82f6';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  }

  get gradeLabel(): string {
    const pct = this.result()?.percentage || 0;
    if (pct >= 80) return 'Excellent';
    if (pct >= 60) return 'Good';
    if (pct >= 40) return 'Pass';
    return 'Fail';
  }

  get correctCount(): number {
    return this.result()?.answers.filter(a => a.isCorrect).length || 0;
  }

  get wrongCount(): number {
    return (this.result()?.answers.length || 0) - this.correctCount;
  }
}
