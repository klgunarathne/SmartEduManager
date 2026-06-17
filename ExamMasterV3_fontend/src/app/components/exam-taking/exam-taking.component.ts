import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { StudentAuthService } from '../../services/student-auth.service';
import { environment } from '../../../environments/environment';

interface ExamQuestion {
  id: number;
  questionId: number;
  order: number;
  question: {
    id: number;
    content: string;
    type: string;
    difficulty: string;
    marks: number;
    options: string[];
    correctAnswer: string;
  };
}

interface ExamAttempt {
  id: number;
  examId: number;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  score: number;
  totalMarks: number;
  isCompleted: boolean;
  status: string;
  exam: {
    id: number;
    title: string;
    description: string;
    duration: number;
    questions: ExamQuestion[];
  };
}

@Component({
  selector: 'app-exam-taking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-taking.component.html',
  styleUrl: './exam-taking.component.scss'
})
export class ExamTakingComponent implements OnInit {
  attempt = signal<ExamAttempt | null>(null);
  currentQuestionIndex = signal(0);
  answers = signal<Map<number, string>>(new Map());
  timeRemaining = signal<number>(0);
  isSubmitting = signal(false);
  showConfirmSubmit = signal(false);
  private timerInterval: any;

  constructor(
    private authService: StudentAuthService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const examId = Number(this.route.snapshot.paramMap.get('id'));
    if (!examId) {
      this.router.navigate(['/exam']);
      return;
    }
    this.startExam(examId);
  }

  get currentQuestion(): ExamQuestion {
    return (this.attempt()!.exam.questions as ExamQuestion[])[this.currentQuestionIndex()]!;
  }

  get totalQuestions(): number {
    return this.attempt()?.exam.questions.length || 0;
  }

  get progress(): number {
    return this.totalQuestions > 0 ? ((this.currentQuestionIndex() + 1) / this.totalQuestions) * 100 : 0;
  }

  get selectedAnswer(): string | undefined {
    const qId = this.currentQuestion?.questionId;
    return qId ? this.answers().get(qId) : undefined;
  }

  onCheckboxChange(option: string, event: Event): void {
    if (!this.currentQuestion) return;
    const checkbox = event.target as HTMLInputElement;
    const current = this.answers().get(this.currentQuestion.questionId) || '';
    const selected = current ? current.split(',') : [];
    
    if (checkbox.checked) {
      if (!selected.includes(option)) {
        selected.push(option);
      }
    } else {
      const index = selected.indexOf(option);
      if (index > -1) selected.splice(index, 1);
    }
    
    this.answers.update(map => {
      const next = new Map(map);
      next.set(this.currentQuestion!.questionId, selected.join(','));
      return next;
    });
  }

  startExam(examId: number): void {
    this.http.post<ExamAttempt>(`${environment.apiUrl}/exam-attempts/start`, { examId }).subscribe({
      next: (data) => {
        this.attempt.set(data);
        this.timeRemaining.set(data.exam.duration * 60);
        this.startTimer();
      },
      error: (err) => {
        console.error('Failed to start exam:', err);
        alert('Failed to start exam. You may have already started this exam.');
        this.router.navigate(['/exam']);
      }
    });
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      const remaining = this.timeRemaining() - 1;
      if (remaining <= 0) {
        this.timeRemaining.set(0);
        clearInterval(this.timerInterval);
        this.submitExam(true);
      } else {
        this.timeRemaining.set(remaining);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  selectAnswer(answer: string): void {
    if (!this.currentQuestion) return;
    this.answers.update(map => {
      const next = new Map(map);
      next.set(this.currentQuestion!.questionId, answer);
      return next;
    });
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex() < this.totalQuestions - 1) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }

  goToQuestion(index: number): void {
    this.currentQuestionIndex.set(index);
  }

  isAnswered(questionId: number): boolean {
    return this.answers().has(questionId);
  }

  confirmSubmit(): void {
    const unanswered = this.totalQuestions - this.answers().size;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to submit?`)) {
        return;
      }
    }
    this.showConfirmSubmit.set(true);
  }

  submitExam(autoSubmit = false): void {
    if (!this.attempt()) return;

    this.isSubmitting.set(true);
    clearInterval(this.timerInterval);

    const answers = Array.from(this.answers().entries()).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer
    }));

    this.http.post(`${environment.apiUrl}/exam-attempts/submit`, {
      examAttemptId: this.attempt()!.id,
      answers
    }).subscribe({
      next: (result: any) => {
        this.router.navigate(['/exam', this.attempt()!.examId, 'result', result.id]);
      },
      error: (err) => {
        console.error('Failed to submit exam:', err);
        this.toast.error('Failed to submit exam');
        this.isSubmitting.set(false);
        if (!autoSubmit) {
          this.showConfirmSubmit.set(false);
        }
      }
    });
  }

  getQuestionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'multiple-choice': 'Multiple Choice',
      'checkbox': 'Checkbox',
      'dropdown': 'Dropdown',
      'true-false': 'True/False',
      'text': 'Text'
    };
    return labels[type] || type;
  }

  getQuestionTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'multiple-choice': 'fa-list-ul',
      'checkbox': 'fa-check-square',
      'dropdown': 'fa-caret-square-down',
      'true-false': 'fa-toggle-on',
      'text': 'fa-font'
    };
    return icons[type] || 'fa-question-circle';
  }

  private toast = {
    error: (msg: string) => alert(msg)
  };

  confirmExit(): void {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      clearInterval(this.timerInterval);
      this.router.navigate(['/exam']);
    }
  }
}
