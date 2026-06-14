import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

type QuestionType = 'multiple-choice' | 'checkbox' | 'dropdown' | 'short-answer' | 'paragraph' | 'linear-scale' | 'rating' | 'date' | 'time';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Question {
  id: number;
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  categoryId: number;
  marks: number;
  options?: QuestionOption[];
  correctAnswer?: string[];
  explanation?: string;
  tags: string[];
  required: boolean;
}

interface QuestionOption {
  id: string;
  content: string;
  isCorrect?: boolean;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  duration: number;
  isActive: boolean;
  questions: ExamQuestion[];
}

interface ExamQuestion {
  id?: number;
  questionId: number;
  question?: Question;
  order: number;
}

@Component({
  selector: 'app-exam-question-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './exam-question-builder.component.html',
  styleUrl: './exam-question-builder.component.scss'
})
export class ExamQuestionBuilderComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  private readonly toast = inject(ToastService);

  // View modes
  viewMode = signal<'edit' | 'preview'>('edit');
  selectedQuestionId = signal<number | null>(null);
  
  // Data
  categories = signal<Category[]>([]);
  banks = signal<Question[]>([]);
  exam = signal<Exam>({
    id: 0,
    title: '',
    description: '',
    categoryId: 0,
    duration: 60,
    isActive: false,
    questions: []
  });

  // UI state
  showSettingsPanel = signal(false);
  showBankPanel = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadQuestionBank();
  }

  // Question types available in palette
  questionTypes: { type: QuestionType; icon: string; label: string }[] = [
    { type: 'multiple-choice', icon: 'fa-circle-dot', label: 'Multiple choice' },
    { type: 'checkbox', icon: 'fa-square-check', label: 'Checkboxes' },
    { type: 'dropdown', icon: 'fa-chevron-down', label: 'Dropdown' },
    { type: 'short-answer', icon: 'fa-pen', label: 'Short answer' },
    { type: 'paragraph', icon: 'fa-align-left', label: 'Paragraph' },
    { type: 'linear-scale', icon: 'fa-sliders', label: 'Linear scale' },
    { type: 'rating', icon: 'fa-star', label: 'Rating' },
    { type: 'date', icon: 'fa-calendar', label: 'Date' },
    { type: 'time', icon: 'fa-clock', label: 'Time' }
  ];

  loadCategories(): void {
    this.http.get<Category[]>(`${this.API_URL}/question-categories`).subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.categories.set([])
    });
  }

  loadQuestionBank(): void {
    this.http.get<Question[]>(`${this.API_URL}/questions`).subscribe({
      next: (data) => this.banks.set(data),
      error: () => this.banks.set([])
    });
  }

  // Add question from palette
  addQuestion(type: QuestionType): void {
    const newQuestion: Question = {
      id: Date.now(),
      content: '',
      type,
      difficulty: 'medium',
      categoryId: this.categories()[0]?.id || 0,
      marks: 1,
      required: false,
      tags: [],
      options: this.getDefaultOptions(type)
    };

    this.exam.update(e => ({
      ...e,
      questions: [...e.questions, { questionId: newQuestion.id, question: newQuestion, order: e.questions.length }]
    }));
    this.selectedQuestionId.set(newQuestion.id);
  }

  getDefaultOptions(type: QuestionType): QuestionOption[] {
    switch (type) {
      case 'multiple-choice':
      case 'checkbox':
      case 'dropdown':
        return [
          { id: 'opt1', content: 'Option 1' },
          { id: 'opt2', content: 'Option 2' }
        ];
      case 'linear-scale':
        return Array.from({ length: 5 }, (_, i) => ({ id: `scale${i+1}`, content: `${i+1}` }));
      default:
        return [];
    }
  }

  // Delete question
  deleteQuestion(questionId: number): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.filter(q => q.questionId !== questionId)
    }));
    if (this.selectedQuestionId() === questionId) {
      this.selectedQuestionId.set(null);
    }
    this.toast.success('Question deleted');
  }

  // Duplicate question
  duplicateQuestion(question: Question): void {
    const newQuestion = {
      ...question,
      id: Date.now(),
      content: `${question.content} (copy)`
    };
    this.exam.update(e => ({
      ...e,
      questions: [...e.questions, { questionId: newQuestion.id, question: newQuestion, order: e.questions.length }]
    }));
    this.toast.success('Question duplicated');
  }

  // Update question
  updateQuestion(updated: Question): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => 
        eq.questionId === updated.id ? { ...eq, question: updated } : eq
      )
    }));
  }

  // Drag-drop reordering
  drop(event: CdkDragDrop<ExamQuestion[]>): void {
    this.exam.update(e => {
      const questions = [...e.questions];
      moveItemInArray(questions, event.previousIndex, event.currentIndex);
      return { ...e, questions };
    });
  }

  // Toggle preview mode
  togglePreview(): void {
    this.viewMode.set(this.viewMode() === 'edit' ? 'preview' : 'edit');
  }

  // Save exam
  saveExam(): void {
    const payload = {
      title: this.exam().title,
      description: this.exam().description,
      categoryId: this.exam().categoryId,
      duration: this.exam().duration,
      questions: this.exam().questions.map((q, i) => ({
        questionId: q.questionId,
        order: i
      }))
    };

    if (this.exam().id) {
      this.http.put(`${this.API_URL}/exams/${this.exam().id}`, payload).subscribe({
        next: () => this.toast.success('Exam saved'),
        error: () => this.toast.error('Failed to save exam')
      });
    } else {
      this.http.post<Exam>(`${this.API_URL}/exams`, payload).subscribe({
        next: (result) => {
          this.exam.set({ ...this.exam(), id: result.id });
          this.toast.success('Exam created');
        },
        error: () => this.toast.error('Failed to create exam')
      });
    }
  }

  // Get selected question for editing
  get selectedQuestion(): Question | null {
    const id = this.selectedQuestionId();
    const eq = this.exam().questions.find(q => q.questionId === id);
    return eq?.question || null;
  }

  // Helper methods
  getQuestionTypeIcon(type: QuestionType): string {
    return this.questionTypes.find(qt => qt.type === type)?.icon || 'fa-question';
  }

  getQuestionTypeLabel(type: QuestionType): string {
    return this.questionTypes.find(qt => qt.type === type)?.label || type;
  }

  // Add option to question
  addOption(questionId: number): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => {
        if (eq.questionId === questionId && eq.question) {
          const options = eq.question.options || [];
          options.push({ id: `opt${Date.now()}`, content: `Option ${options.length + 1}` });
          return { ...eq, question: { ...eq.question, options } };
        }
        return eq;
      })
    }));
  }

  // Remove option from question
  removeOption(questionId: number, optionId: string): void {
    this.exam.update(e => ({
      ...e,
      questions: e.questions.map(eq => {
        if (eq.questionId === questionId && eq.question?.options) {
          return {
            ...eq,
            question: {
              ...eq.question,
              options: eq.question.options.filter(opt => opt.id !== optionId)
            }
          };
        }
        return eq;
      })
    }));
  }
}