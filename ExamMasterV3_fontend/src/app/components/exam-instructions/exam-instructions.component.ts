import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { Exam, ExamQuestion } from '../../models/exam.models';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-exam-instructions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-instructions.component.html',
  styleUrl: './exam-instructions.component.scss'
})
export class ExamInstructionsComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  exam = signal<Exam | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const examId = Number(this.route.snapshot.paramMap.get('id'));

    if (!examId) {
      this.router.navigate(['/exam']);
      return;
    }

    this.loadExam(examId);
  }

  loadExam(examId: number): void {
    this.examService.getExamWithQuestions(examId).subscribe({
      next: data => {
        this.exam.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Unable to load exam details.');
        this.isLoading.set(false);
      }
    });
  }

  startExam(): void {
    const exam = this.exam();
    if (!exam) {
      return;
    }

    if (exam.status !== 'active' && exam.status !== 'scheduled') {
      this.toast.error('This exam is not currently available.');
      return;
    }

    if (exam.maxAttempts > 0 && exam.attemptsUsed >= exam.maxAttempts) {
      this.toast.error('You have reached the maximum number of attempts for this exam.');
      return;
    }

    this.router.navigate(['/exam', exam.id]);
  }

  get totalMarks(): number {
    return this.exam()?.questions.reduce((sum, item) => sum + (item.question?.marks ?? 0), 0) ?? 0;
  }

  attemptLabel(exam: Exam): string {
    if (exam.maxAttempts === 0) {
      return `Attempt ${exam.attemptsUsed + 1}`;
    }

    return `Attempt ${exam.attemptsUsed + 1} of ${exam.maxAttempts}`;
  }

  goBack(): void {
    this.router.navigate(['/exam']);
  }
}
