import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';

type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
type DifficultyLevel = 'easy' | 'medium' | 'hard';
type ActiveTab = 'bank' | 'builder' | 'exams';

interface Category {
  id: number;
  name: string;
  color: string;
  questionCount: number;
}

interface Question {
  id: number;
  content: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  categoryId: number;
  categoryName: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  totalMarks: number;
  questionCount: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
}

interface ExamQuestion {
  id: number;
  examId: number;
  questionId: number;
  question?: Question;
  order: number;
}

@Component({
  selector: 'app-exam-question-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-question-builder.component.html',
  styleUrl: './exam-question-builder.component.scss'
})
export class ExamQuestionBuilderComponent implements OnInit {
  private readonly API_URL = environment.apiUrl;
  private readonly toast = inject(ToastService);

activeTab = signal<ActiveTab>('bank');
  isLoading = signal(false);

  // Question Bank signals
  categories = signal<Category[]>([]);
  questions = signal<Question[]>([]);
  filteredQuestions = signal<Question[]>([]);
  selectedCategory = signal<number | null>(null);
  searchTerm = '';
  selectedQuestionType = '';

  // Question form
  showQuestionModal = signal(false);
  editingQuestion = signal<Question | null>(null);
  questionForm = {
    content: '',
    type: 'multiple-choice' as QuestionType,
    difficulty: 'medium' as DifficultyLevel,
    categoryId: 0,
    marks: 1,
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    tags: ''
  };

  // Exam Builder signals
  exams = signal<Exam[]>([]);
  selectedExam = signal<Exam | null>(null);
  examQuestions = signal<ExamQuestion[]>([]);
  showExamModal = signal(false);
  examForm = {
    title: '',
    description: '',
    categoryId: 0,
    duration: 60
  };

  // Category management
  showCategoryModal = signal(false);
  categoryForm = {
    name: '',
    color: '#6366f1'
  };
  editingCategory = signal<Category | null>(null);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadQuestions();
    this.loadExams();
  }

  // Category CRUD
  loadCategories(): void {
    this.http.get<Category[]>(`${this.API_URL}/question-categories`).subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.categories.set([])
    });
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) return;

    const payload = {
      name: this.categoryForm.name.trim(),
      color: this.categoryForm.color
    };

    if (this.editingCategory()) {
      this.http.put(`${this.API_URL}/question-categories/${this.editingCategory()!.id}`, payload).subscribe({
        next: () => { this.loadCategories(); this.hideCategoryModal(); this.toast.success('Category updated'); },
        error: () => this.toast.error('Failed to update category')
      });
    } else {
      this.http.post<Category>(`${this.API_URL}/question-categories`, payload).subscribe({
        next: () => { this.loadCategories(); this.hideCategoryModal(); this.toast.success('Category created'); },
        error: () => this.toast.error('Failed to create category')
      });
    }
  }

  deleteCategory(id: number, name: string): void {
    if (!confirm(`Delete category "${name}"? All questions in this category will be unassigned.`)) return;
    this.http.delete(`${this.API_URL}/question-categories/${id}`).subscribe({
      next: () => { this.loadCategories(); this.selectedCategory.set(null); this.toast.success('Category deleted'); },
      error: () => this.toast.error('Failed to delete category')
    });
  }

  editCategory(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm = { name: category.name, color: category.color };
    this.showCategoryModal.set(true);
  }

  hideCategoryModal(): void {
    this.showCategoryModal.set(false);
    this.editingCategory.set(null);
    this.categoryForm = { name: '', color: '#6366f1' };
  }

  // Question Bank operations
  loadQuestions(): void {
    this.http.get<Question[]>(`${this.API_URL}/questions`).subscribe({
      next: (data) => { this.questions.set(data); this.applyFilters(); },
      error: () => { this.questions.set([]); this.filteredQuestions.set([]); }
    });
  }

  applyFilters(): void {
    let filtered = [...this.questions()];
    
    if (this.selectedCategory()) {
      filtered = filtered.filter(q => q.categoryId === this.selectedCategory());
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.content.toLowerCase().includes(term) || 
        q.tags.some(t => t.toLowerCase().includes(term))
      );
    }

    if (this.selectedQuestionType) {
      filtered = filtered.filter(q => q.type === this.selectedQuestionType);
    }

    this.filteredQuestions.set(filtered);
  }

  // Question CRUD
  openQuestionModal(question?: Question): void {
    if (question) {
      this.editingQuestion.set(question);
      this.questionForm = {
        content: question.content,
        type: question.type,
        difficulty: question.difficulty,
        categoryId: question.categoryId,
        marks: question.marks,
        options: question.options || ['', '', '', ''],
        correctAnswer: question.correctAnswer || '',
        explanation: question.explanation || '',
        tags: question.tags.join(', ')
      };
    } else {
      this.editingQuestion.set(null);
      this.questionForm = {
        content: '',
        type: 'multiple-choice',
        difficulty: 'medium',
        categoryId: this.categories()[0]?.id || 0,
        marks: 1,
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        tags: ''
      };
    }
    this.showQuestionModal.set(true);
  }

  hideQuestionModal(): void {
    this.showQuestionModal.set(false);
    this.editingQuestion.set(null);
  }

  saveQuestion(): void {
    if (!this.questionForm.content.trim()) return;

    const payload = {
      content: this.questionForm.content.trim(),
      type: this.questionForm.type,
      difficulty: this.questionForm.difficulty,
      categoryId: this.questionForm.categoryId,
      marks: this.questionForm.marks,
      options: this.questionForm.type === 'multiple-choice' ? this.questionForm.options.filter(o => o.trim()) : [],
      correctAnswer: this.questionForm.correctAnswer,
      explanation: this.questionForm.explanation,
      tags: this.questionForm.tags.split(',').map(t => t.trim()).filter(t => t)
    };

    if (this.editingQuestion()) {
      this.http.put(`${this.API_URL}/questions/${this.editingQuestion()!.id}`, payload).subscribe({
        next: () => { this.loadQuestions(); this.hideQuestionModal(); this.toast.success('Question updated'); },
        error: () => this.toast.error('Failed to update question')
      });
    } else {
      this.http.post<Question>(`${this.API_URL}/questions`, payload).subscribe({
        next: () => { this.loadQuestions(); this.hideQuestionModal(); this.toast.success('Question created'); },
        error: () => this.toast.error('Failed to create question')
      });
    }
  }

  deleteQuestion(id: number): void {
    if (!confirm('Delete this question?')) return;
    this.http.delete(`${this.API_URL}/questions/${id}`).subscribe({
      next: () => { this.loadQuestions(); this.toast.success('Question deleted'); },
      error: () => this.toast.error('Failed to delete question')
    });
  }

  // Exam Builder operations
  loadExams(): void {
    this.http.get<Exam[]>(`${this.API_URL}/exams`).subscribe({
      next: (data) => this.exams.set(data),
      error: () => this.exams.set([])
    });
  }

  openExamModal(): void {
    this.examForm = { title: '', description: '', categoryId: this.categories()[0]?.id || 0, duration: 60 };
    this.showExamModal.set(true);
  }

  hideExamModal(): void {
    this.showExamModal.set(false);
  }

  createExam(): void {
    if (!this.examForm.title.trim()) return;

    const payload = {
      title: this.examForm.title.trim(),
      description: this.examForm.description.trim(),
      categoryId: this.examForm.categoryId,
      duration: this.examForm.duration
    };

    this.http.post<Exam>(`${this.API_URL}/exams`, payload).subscribe({
      next: (exam) => {
        this.exams.update(e => [...e, exam]);
        this.hideExamModal();
        this.selectExam(exam);
        this.activeTab.set('builder');
        this.toast.success('Exam created');
      },
      error: () => this.toast.error('Failed to create exam')
    });
  }

  selectExam(exam: Exam): void {
    this.selectedExam.set(exam);
    this.loadExamQuestions(exam.id);
  }

  loadExamQuestions(examId: number): void {
    this.http.get<ExamQuestion[]>(`${this.API_URL}/exams/${examId}/questions`).subscribe({
      next: (data) => this.examQuestions.set(data),
      error: () => this.examQuestions.set([])
    });
  }

  addQuestionToExam(question: Question): void {
    if (!this.selectedExam()) return;
    
    const payload = {
      examId: this.selectedExam()!.id,
      questionId: question.id
    };

    this.http.post<ExamQuestion>(`${this.API_URL}/exams/${this.selectedExam()!.id}/questions`, payload).subscribe({
      next: (eq) => { this.examQuestions.update(list => [...list, eq]); this.toast.success('Question added to exam'); },
      error: () => this.toast.error('Failed to add question to exam')
    });
  }

  removeQuestionFromExam(questionId: number): void {
    if (!this.selectedExam()) return;
    
    this.http.delete(`${this.API_URL}/exams/${this.selectedExam()!.id}/questions/${questionId}`).subscribe({
      next: () => { this.examQuestions.update(list => list.filter(eq => eq.questionId !== questionId)); this.toast.success('Question removed from exam'); },
      error: () => this.toast.error('Failed to remove question from exam')
    });
  }

  // Helpers
  getCategoryColor(categoryId: number): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.color || '#6366f1';
  }

  getDifficultyColor(difficulty: DifficultyLevel): { bg: string; text: string } {
    const colors = {
      easy: '#dcfce7',
      medium: '#fef3c7',
      hard: '#fee2e2'
    };
    const textColors = {
      easy: '#16a34a',
      medium: '#d97706',
      hard: '#dc2626'
    };
    return { bg: colors[difficulty], text: textColors[difficulty] };
  }

  questionTypeIcon(type: QuestionType): string {
    const icons = {
      'multiple-choice': 'fa-list-ul',
      'true-false': 'fa-toggle-on',
      'short-answer': 'fa-pen',
      'essay': 'fa-align-left'
    };
    return icons[type] || 'fa-question';
  }

  getQuestionTypeLabel(type: QuestionType): string {
    const labels = {
      'multiple-choice': 'Multiple Choice',
      'true-false': 'True/False',
      'short-answer': 'Short Answer',
      'essay': 'Essay'
    };
    return labels[type];
  }

  totalExamMarks(): number {
    return this.examQuestions().reduce((total, eq) => total + (eq.question?.marks || 0), 0);
  }
}