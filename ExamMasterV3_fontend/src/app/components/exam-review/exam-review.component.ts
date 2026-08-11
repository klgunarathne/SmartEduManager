import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { Exam, ExamQuestion, ExamAnswerSubmission } from '../../models/exam.models';

@Component({
  selector: 'app-exam-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-review.component.html',
  styleUrl: './exam-review.component.scss'
})
export class ExamReviewComponent implements OnInit {
  private readonly examService = inject(ExamService);
  private readonly router = inject(Router);

  attemptId = signal<number | null>(null);
  exam = signal<Exam | null>(null);
  answers = signal<Map<number, string>>(new Map());
  isLoading = signal(true);

  ngOnInit(): void {
    const saved = sessionStorage.getItem('exam-master-review');
    if (!saved) {
      this.router.navigate(['/exam']);
      return;
    }

    try {
      const data = JSON.parse(saved);
      this.attemptId.set(data.attemptId ?? null);
      this.exam.set(data.exam ?? null);
      this.answers.set(new Map(data.answers ?? []));
    } catch {
      this.router.navigate(['/exam']);
    } finally {
      this.isLoading.set(false);
    }
  }

  get questions(): ExamQuestion[] {
    return this.exam()?.questions ?? [];
  }

  get answeredCount(): number {
    return Array.from(this.answers().entries()).filter(([, value]) => value.trim().length > 0).length;
  }

  selectedAnswerFor(questionId: number): string | undefined {
    return this.answers().get(questionId);
  }

  isAnswered(questionId: number): boolean {
    return (this.answers().get(questionId) ?? '').trim().length > 0;
  }

  isMultipleChoice(type?: string): boolean {
    return type === 'multiple-choice';
  }

  isCheckbox(type?: string): boolean {
    return type === 'checkbox';
  }

  isTrueFalse(type?: string): boolean {
    return type === 'true-false';
  }

  selectAnswer(questionId: number, value: string): void {
    this.answers.update(map => {
      const next = new Map(map);
      next.set(questionId, value);
      return next;
    });
  }

  toggleCheckbox(questionId: number, option: string): void {
    const current = this.answers().get(questionId) || '';
    const selected = current ? current.split(',').filter(Boolean) : [];
    const index = selected.indexOf(option);

    if (index > -1) {
      selected.splice(index, 1);
    } else {
      selected.push(option);
    }

    this.setAnswer(questionId, selected.join(','));
  }

  setAnswer(questionId: number, value: string): void {
    this.answers.update(map => {
      const next = new Map(map);
      next.set(questionId, value);
      return next;
    });
  }

  submitAndContinue(): void {
    const attemptId = this.attemptId();
    const exam = this.exam();
    if (!attemptId || !exam) {
      this.router.navigate(['/exam']);
      return;
    }

    const payload: ExamAnswerSubmission[] = this.questions.map(q => ({
      questionId: q.questionId,
      selectedAnswer: this.answers().get(q.questionId) ?? ''
    }));

    this.examService.submitExam(attemptId, payload).subscribe({
      next: result => {
        sessionStorage.removeItem('exam-master-review');
        this.router.navigate(['/exam', exam.id, 'result', result.id]);
      },
      error: () => {
        this.router.navigate(['/exam']);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/exam']);
  }
}
